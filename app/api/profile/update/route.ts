import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { verifyAuth } from '@/lib/middleware';

export async function PUT(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();

    // Use || null so empty strings ("") become null — important for DATE and INT columns
    // (Postgres throws a type error if "" is inserted into date_of_birth or years_of_experience)
    const fullFields: Record<string, unknown> = {
      full_name:                        data.full_name                        || null,
      email:                            data.email                            || null,
      title:                            data.title                            || null,
      date_of_birth:                    data.date_of_birth                    || null,
      gender:                           data.gender                           || null,
      city:                             data.city                             || null,
      county:                           data.county                           || null,
      country:                          data.country                          || null,
      educational_level:                data.educational_level                || null,
      marital_status:                   data.marital_status                   || null,
      employment_status:                data.employment_status                || null,
      occupation:                       data.occupation                       || null,
      phone_number:                     data.phone_number                     || null,
      emergency_contact_name:           data.emergency_contact_name           || null,
      emergency_contact_phone:          data.emergency_contact_phone          || null,
      emergency_contact_relationship:   data.emergency_contact_relationship   || null,
      specialization:                   data.specialization                   || null,
      years_of_experience:              data.years_of_experience              || null,
      license_number:                   data.license_number                   || null,
      research_interests:               data.research_interests               || null,
      current_projects:                 data.current_projects                 || null,
      bio:                              data.bio                              || null,
    };

    // Core fields that always exist (from auth.ts createUser)
    const coreFields: Record<string, unknown> = {
      full_name:    data.full_name    || null,
      bio:          data.bio          || null,
    };

    const buildUpdate = (fields: Record<string, unknown>) => {
      const entries = Object.entries(fields).filter(([, v]) => v !== undefined);
      const set = entries.map(([col]) => `${col} = ?`).join(', ');
      const vals = entries.map(([, v]) => v);
      return { set, vals };
    };

    // Try full update first
    try {
      const { set, vals } = buildUpdate(fullFields);
      await pool.execute(`UPDATE users SET ${set} WHERE id = ?`, [...vals, user.userId]);
      return NextResponse.json({ success: true, message: 'Profile updated successfully' });
    } catch (fullErr: unknown) {
      const errCode = (fullErr as { code?: string })?.code;
      const errMsg  = String((fullErr as { message?: string })?.message || '').toLowerCase();

      // 42703 = column does not exist; 22P02 = invalid input syntax (e.g. "" for INT/DATE)
      // For both, fall back to a smaller field set rather than crashing
      const isRecoverable =
        errCode === '42703' ||
        errCode === '22P02' ||
        errMsg.includes('column') ||
        errMsg.includes('does not exist') ||
        errMsg.includes('unknown column') ||
        errMsg.includes('invalid input syntax') ||
        errMsg.includes('invalid value');

      if (!isRecoverable) {
        throw fullErr; // truly unexpected — re-throw to outer catch
      }

      console.warn('[Profile Update] Some columns missing, retrying with core fields:', errMsg);
    }

    // Fallback: try phone_number / phone columns one at a time
    try {
      const { set, vals } = buildUpdate({ ...coreFields, phone_number: data.phone_number ?? null });
      await pool.execute(`UPDATE users SET ${set} WHERE id = ?`, [...vals, user.userId]);
    } catch {
      try {
        const { set, vals } = buildUpdate({ ...coreFields, phone: data.phone_number ?? null });
        await pool.execute(`UPDATE users SET ${set} WHERE id = ?`, [...vals, user.userId]);
      } catch {
        // last resort: update only full_name and bio
        const { set, vals } = buildUpdate(coreFields);
        await pool.execute(`UPDATE users SET ${set} WHERE id = ?`, [...vals, user.userId]);
      }
    }

    return NextResponse.json({ success: true, message: 'Profile updated successfully (partial — some fields may not have been saved)' });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error ?? 'Unknown error');
    console.error('[Profile Update] Error:', error);
    return NextResponse.json(
      { error: 'Failed to update profile', details: msg },
      { status: 500 }
    );
  }
}
