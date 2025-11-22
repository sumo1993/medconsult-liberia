# 🖼️ Hero Image Management Feature

## ✅ **Feature Complete!**

Admin can now change the hero section background image from the dashboard.

---

## 🎯 **What Was Created:**

### **1. Admin Page**
- **Location:** `/dashboard/admin/hero-settings`
- **Features:**
  - Upload new images (drag & drop or click)
  - Use external image URLs
  - Live preview of hero section
  - Reset to default image
  - Image validation (type & size)

### **2. API Endpoint**
- **Location:** `/api/admin/upload-hero`
- **Features:**
  - Secure file upload (admin only)
  - Image validation
  - Automatic file naming
  - Database storage

### **3. Updated Components**
- **Hero Component:** Now fetches image from database
- **Admin Dashboard:** Added "Hero Image" button

---

## 🚀 **How to Use:**

### **Step 1: Login as Admin**
```
Email: admin@medconsult.com
Password: Admin@123
```

### **Step 2: Go to Hero Settings**
1. From Admin Dashboard
2. Click **"Hero Image"** button (teal color)
3. Or go to: `http://localhost:3000/dashboard/admin/hero-settings`

### **Step 3: Change Hero Image**

**Option A: Upload Image**
1. Click upload area or drag & drop image
2. Select image file (PNG, JPG, WEBP)
3. Preview appears
4. Click "Upload" button
5. Done! Image saved and displayed

**Option B: Use URL**
1. Paste image URL in text field
2. Preview updates automatically
3. Click "Save URL" button
4. Done!

### **Step 4: View Changes**
1. Go to homepage: `http://localhost:3000`
2. Hero section now shows your new image!

---

## 📸 **Image Requirements:**

### **Upload:**
- **Format:** PNG, JPG, JPEG, WEBP
- **Max Size:** 5MB
- **Recommended:** 1920x1080px or larger
- **Aspect Ratio:** 16:9 works best

### **URL:**
- Must be publicly accessible
- HTTPS recommended
- Direct image link (ends in .jpg, .png, etc.)

---

## 🎨 **Features:**

### **Live Preview**
- See how image looks before saving
- Preview shows hero section layout
- Text overlay preview included

### **Multiple Upload Options**
1. **Upload from computer**
   - Drag & drop
   - Click to browse
   - Automatic optimization

2. **Use external URL**
   - Unsplash
   - Your own hosting
   - CDN links

### **Safety Features**
- ✅ Admin authentication required
- ✅ File type validation
- ✅ File size limits
- ✅ Secure file storage
- ✅ Error handling

---

## 📁 **File Structure:**

```
/public/uploads/hero/
  ├── hero-1234567890.jpg
  ├── hero-1234567891.png
  └── README.md

/app/dashboard/admin/hero-settings/
  └── page.tsx

/app/api/admin/upload-hero/
  └── route.ts

/components/
  └── Hero.tsx (updated)
```

---

## 🔧 **Technical Details:**

### **Database:**
- Stored in `site_settings` table
- Key: `hero_image`
- Value: Image URL or path

### **Storage:**
- Uploaded files: `/public/uploads/hero/`
- Filename format: `hero-{timestamp}.{ext}`
- Publicly accessible via `/uploads/hero/{filename}`

### **API:**
```typescript
POST /api/admin/upload-hero
- Auth: Required (admin only)
- Body: FormData with 'file'
- Returns: { imageUrl, filename }

PUT /api/admin/site-settings
- Auth: Required (admin only)
- Body: { settings: [{ key, value }] }
- Updates: hero_image setting
```

---

## 🧪 **Testing:**

### **Test Upload:**
1. Login as admin
2. Go to Hero Settings
3. Upload a test image
4. Check homepage - should show new image
5. Upload another - should replace previous

### **Test URL:**
1. Use this test URL:
   ```
   https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=1920
   ```
2. Paste in URL field
3. Click Save URL
4. Check homepage

### **Test Reset:**
1. Click "Reset to Default"
2. Default Unsplash image appears
3. Save if desired

---

## 🎯 **User Flow:**

```
Admin Dashboard
    ↓
Click "Hero Image" button
    ↓
Hero Settings Page
    ↓
Choose method:
    ├─ Upload Image → Select file → Upload → Done
    └─ Use URL → Paste URL → Save → Done
    ↓
Homepage updates automatically
```

---

## 📊 **Admin Dashboard Integration:**

The Hero Image button is in the Quick Actions section:
- **Color:** Teal (bg-teal-600)
- **Icon:** Image icon
- **Position:** After "Site Settings"
- **Label:** "Hero Image"

---

## 🔒 **Security:**

### **Authentication:**
- Only admin role can access
- JWT token verification
- Session validation

### **File Validation:**
- File type checking
- Size limits enforced
- Secure file naming
- No script execution

### **Path Security:**
- Files stored in public directory
- No directory traversal
- Sanitized filenames

---

## 💡 **Tips:**

### **Best Practices:**
1. Use high-quality images (1920x1080 or larger)
2. Light-colored images work best (white overlay applied)
3. Test on mobile and desktop
4. Keep file sizes reasonable (<2MB ideal)
5. Use descriptive filenames before upload

### **Image Sources:**
- **Unsplash:** Free high-quality images
- **Pexels:** Free stock photos
- **Your own:** Upload custom images
- **CDN:** Use your image hosting

### **Performance:**
- Compress images before upload
- Use modern formats (WebP)
- Consider lazy loading for large images

---

## 🐛 **Troubleshooting:**

### **Upload Fails:**
- Check file size (<5MB)
- Check file type (image only)
- Check admin authentication
- Check server permissions

### **Image Not Showing:**
- Clear browser cache
- Check file path is correct
- Verify image URL is accessible
- Check console for errors

### **Preview Not Updating:**
- Refresh page
- Check network tab
- Verify API response

---

## 📝 **Future Enhancements:**

Potential additions:
- Image cropping tool
- Multiple hero images (slideshow)
- Image filters/effects
- Automatic optimization
- Image library/gallery
- Scheduled image changes

---

## ✅ **Summary:**

**What Admin Can Do:**
- ✅ Upload custom hero images
- ✅ Use external image URLs
- ✅ Preview before saving
- ✅ Reset to default
- ✅ See changes immediately

**What Users See:**
- ✅ Updated hero image on homepage
- ✅ Professional appearance
- ✅ Fast loading
- ✅ Responsive design

---

**🎉 The feature is ready to use! Login as admin and try it out!**

**Access:** http://localhost:3000/dashboard/admin/hero-settings
