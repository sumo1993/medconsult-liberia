import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { verifyAuth } from '@/lib/middleware';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

// Ensure receipt_photo column exists
async function ensureReceiptColumn() {
  try {
    // Check if column exists
    const [columns]: any = await pool.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'transactions' 
      AND COLUMN_NAME = 'receipt_photo'
    `);
    
    // If column doesn't exist, add it
    if (columns.length === 0) {
      await pool.execute(`
        ALTER TABLE transactions 
        ADD COLUMN receipt_photo VARCHAR(255) NULL
      `);
      console.log('✅ receipt_photo column added to transactions table');
    }
  } catch (error) {
    console.error('Error ensuring receipt_photo column:', error);
  }
}

// Ensure fee breakdown columns exist in consultant_earnings
async function ensureFeeBreakdownColumns() {
  try {
    // Check if website_fee column exists
    const [columns]: any = await pool.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'consultant_earnings' 
      AND COLUMN_NAME = 'website_fee'
    `);
    
    // If columns don't exist, add them
    if (columns.length === 0) {
      await pool.execute(`
        ALTER TABLE consultant_earnings 
        ADD COLUMN website_fee DECIMAL(10, 2) DEFAULT 0 COMMENT '10% platform fee',
        ADD COLUMN team_fee DECIMAL(10, 2) DEFAULT 0 COMMENT '15% team fee',
        ADD COLUMN notes TEXT COMMENT 'Breakdown details'
      `);
      console.log('✅ Fee breakdown columns added to consultant_earnings table');
    }
    
    // Ensure consultant_id allows NULL for team-only distributions
    await pool.execute(`
      ALTER TABLE consultant_earnings 
      MODIFY COLUMN consultant_id INT NULL
    `);
    console.log('✅ consultant_id column set to allow NULL');
  } catch (error) {
    console.error('Error ensuring fee breakdown columns:', error);
  }
}

// GET all transactions (accountant only)
export async function GET(request: NextRequest) {
  try {
    await ensureReceiptColumn(); // Ensure column exists
    
    const user = await verifyAuth(request);
    if (!user || (user.role !== 'admin' && user.role !== 'accountant')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const type = searchParams.get('type');
    const status = searchParams.get('status');

    let sql = `
      SELECT t.*, 
             u1.full_name as consultant_name,
             u2.full_name as client_name
      FROM transactions t
      LEFT JOIN users u1 ON t.consultant_id = u1.id
      LEFT JOIN users u2 ON t.client_id = u2.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (startDate) {
      sql += ' AND t.transaction_date >= ?';
      params.push(startDate);
    }
    if (endDate) {
      sql += ' AND t.transaction_date <= ?';
      params.push(endDate);
    }
    if (type) {
      sql += ' AND t.transaction_type = ?';
      params.push(type);
    }
    if (status) {
      sql += ' AND t.payment_status = ?';
      params.push(status);
    }

    sql += ' ORDER BY t.transaction_date DESC';

    const [transactions] = await pool.execute(sql, params);
    return NextResponse.json(transactions);
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 });
  }
}

// POST create new transaction
export async function POST(request: NextRequest) {
  try {
    await ensureReceiptColumn(); // Ensure column exists
    await ensureFeeBreakdownColumns(); // Ensure fee breakdown columns exist
    
    const user = await verifyAuth(request);
    if (!user || (user.role !== 'admin' && user.role !== 'accountant')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      transaction_type,
      amount,
      currency = 'USD',
      description,
      consultant_id,
      client_id,
      partnership_id,
      payment_method,
      payment_status = 'completed',
      transaction_date,
      receipt_photo,
      distribute_to_team = false
    } = body;

    if (!transaction_type || !amount) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Handle photo upload if provided
    let receiptPath = null;
    if (receipt_photo && receipt_photo.startsWith('data:image')) {
      const base64Data = receipt_photo.split(',')[1];
      const buffer = Buffer.from(base64Data, 'base64');
      const fileName = `transaction-${Date.now()}.jpg`;
      const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'receipts');
      
      // Ensure directory exists
      try {
        await mkdir(uploadDir, { recursive: true });
      } catch (err) {
        // Directory already exists
      }
      
      receiptPath = `/uploads/receipts/${fileName}`;
      await writeFile(path.join(uploadDir, fileName), buffer);
    }

    const [result]: any = await pool.execute(
      `INSERT INTO transactions 
       (transaction_type, amount, currency, description, consultant_id, client_id, 
        partnership_id, payment_method, payment_status, transaction_date, created_by, receipt_photo)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        transaction_type, 
        amount, 
        currency, 
        description || null, 
        consultant_id || null, 
        client_id || null,
        partnership_id || null, 
        payment_method, 
        payment_status, 
        transaction_date || new Date(), 
        user.userId, 
        receiptPath
      ]
    );

    // If it's a consultation fee, create consultant earning
    if (transaction_type === 'consultation_fee' && consultant_id) {
      // Commission breakdown:
      // For consultation fees, calculate commission breakdown
      const consultantRate = 75; // 75% to consultant
      const ceoRate = 10; // 40% of 25% team share
      const itRate = 6.25; // 25% of 25% team share
      const accountantRate = 3.75; // 15% of 25% team share
      const othersRate = 3.75; // 15% of 25% team share
      const websiteRate = 1.25; // 5% of 25% team share (balance)
      
      const consultantEarning = (parseFloat(amount) * consultantRate) / 100;
      const teamFee = (parseFloat(amount) * (ceoRate + itRate + accountantRate + othersRate)) / 100; // Total team: 23.75%
      const websiteFee = (parseFloat(amount) * websiteRate) / 100;
      
      await pool.execute(
        `INSERT INTO consultant_earnings 
         (consultant_id, transaction_id, amount, commission_rate, net_earning, payment_status, 
          website_fee, team_fee, notes)
         VALUES (?, ?, ?, ?, ?, 'pending', ?, ?, ?)`,
        [
          consultant_id, 
          result.insertId, 
          amount, 
          consultantRate, 
          consultantEarning,
          websiteFee,
          teamFee,
          `Breakdown: ${consultantRate}% consultant ($${consultantEarning.toFixed(2)}), CEO ${ceoRate}%, IT ${itRate}%, Accountant ${accountantRate}%, Others ${othersRate}%, Website ${websiteRate}% ($${websiteFee.toFixed(2)})`
        ]
      );
    }
    
    // If distribute_to_team is checked for non-consultation transactions
    // Partnership distribution: CEO 40%, IT 25%, Accountant 15%, Others 15%, Website 5%
    if (distribute_to_team && transaction_type !== 'consultation_fee') {
      const ceoRate = 40;
      const itRate = 25;
      const accountantRate = 15;
      const othersRate = 15;
      const websiteRate = 5;
      
      const ceoShare = (parseFloat(amount) * ceoRate) / 100;
      const itShare = (parseFloat(amount) * itRate) / 100;
      const accountantShare = (parseFloat(amount) * accountantRate) / 100;
      const othersShare = (parseFloat(amount) * othersRate) / 100;
      const websiteFee = (parseFloat(amount) * websiteRate) / 100;
      
      // Total team share for partnerships (CEO + IT + Accountant + Others = 95%)
      const totalTeamShare = ceoShare + itShare + accountantShare + othersShare;
      
      // Create entry with null consultant_id to track partnership distribution
      await pool.execute(
        `INSERT INTO consultant_earnings 
         (consultant_id, transaction_id, amount, commission_rate, net_earning, payment_status, 
          website_fee, team_fee, notes)
         VALUES (?, ?, ?, ?, ?, 'pending', ?, ?, ?)`,
        [
          null, // No consultant for partnership/grant payments
          result.insertId, 
          amount, 
          0, // 0% to consultant
          0, // $0 to consultant
          websiteFee,
          totalTeamShare, // Store total team share (80%)
          `Partnership distribution: CEO ${ceoRate}% ($${ceoShare.toFixed(2)}), IT ${itRate}% ($${itShare.toFixed(2)}), Accountant ${accountantRate}% ($${accountantShare.toFixed(2)}), Others ${othersRate}% ($${othersShare.toFixed(2)}), Website ${websiteRate}% ($${websiteFee.toFixed(2)})`
        ]
      );
    }

    return NextResponse.json({ 
      message: 'Transaction created successfully',
      id: result.insertId 
    }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating transaction:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      sqlMessage: error.sqlMessage
    });
    return NextResponse.json({ 
      error: 'Failed to create transaction',
      details: error.message,
      code: error.code
    }, { status: 500 });
  }
}
