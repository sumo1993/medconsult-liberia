# Social Media Settings Guide

## Overview
You can now manage social media links (WhatsApp and Facebook Messenger) from the admin dashboard. These settings control what appears on your website's Contact page and Footer.

## How to Access

1. Log in to the admin dashboard
2. Navigate to: **Admin Dashboard → Site Settings**
3. Or go directly to: `/dashboard/admin/site-settings`

## Settings Available

### WhatsApp (Always Active)
- **WhatsApp Number**: Your contact number with country code (e.g., +231 888 293 976)
- **WhatsApp Link**: The clickable link (e.g., https://wa.me/231888293976)

### Facebook Messenger (Optional)
- **Enable/Disable**: Toggle to show/hide Facebook Messenger on the site
- **Messenger Link**: Your Facebook page messenger link (e.g., https://m.me/your-page-username)

## How to Get Your Facebook Messenger Link

1. Go to your Facebook Page
2. Click on "About" section
3. Look for your page username (e.g., @yourpagename)
4. Your messenger link will be: `https://m.me/yourpagename`

## Current Settings

**WhatsApp:**
- Number: +231 888 293 976
- Link: https://wa.me/231888293976

**Facebook Messenger:**
- Status: Coming soon (currently disabled)
- Link: (to be added when ready)

## Where These Appear

The social media links appear in two places on your website:
1. **Contact Page**: In the "Connect With Us" section
2. **Footer**: At the bottom of every page

## Making Changes

1. Go to Site Settings in admin dashboard
2. Update the fields you want to change
3. For Facebook Messenger:
   - Check the "Enable Facebook Messenger" box
   - Enter your messenger link
4. Click "Save Settings"
5. Changes take effect immediately

## Notes

- WhatsApp is always visible on the site
- Facebook Messenger only shows when enabled
- Make sure to test links after saving to ensure they work
- The site will show "Facebook Messenger coming soon" until you enable it

## Database

Settings are stored in the `site_settings` table with these keys:
- `whatsapp_number`
- `whatsapp_link`
- `facebook_messenger_link`
- `facebook_messenger_enabled`
