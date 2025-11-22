# 🧹 Clear Oversized Draft - Instructions

## ✅ Automatic Fix (Recommended)

The system now **automatically detects and clears** oversized drafts!

Just **refresh the page** and:
- If the draft is too large (>500KB), it will be automatically cleared
- You'll see a notification explaining why
- You can start fresh immediately

---

## 🔧 Manual Fix (If Needed)

If you want to manually clear the draft:

### Option 1: Browser Console
1. Press **F12** to open Developer Tools
2. Go to **Console** tab
3. Paste this command:
```javascript
localStorage.removeItem('research-draft');
console.log('✅ Draft cleared!');
```
4. Press **Enter**
5. **Refresh the page**

### Option 2: Clear All localStorage
1. Press **F12** to open Developer Tools
2. Go to **Console** tab
3. Paste this command:
```javascript
localStorage.clear();
console.log('✅ All localStorage cleared!');
```
4. Press **Enter**
5. **Refresh the page**
6. **Log in again** (this clears your auth token too)

---

## 🎯 What Happens Now:

When you refresh the page:
1. ✅ System checks draft size
2. ✅ If >500KB, automatically clears it
3. ✅ Shows notification explaining why
4. ✅ You start with a clean form

---

## 📝 Create Your Post Correctly:

### Step 1: Title
```
HIV
```

### Step 2: Content (TEXT ONLY)
- Type your research content
- Use formatting (bold, headers, lists)
- **DO NOT paste images**

### Step 3: Featured Image
- Click "Featured Image" section
- Upload ONE image (max 5MB)

### Step 4: PDF (Optional)
- Click "PDF Document" section
- Upload PDF (max 10MB)

### Step 5: Save
- Click "Save Draft" or "Publish"

---

## ⚠️ Important Tips:

### ✅ DO:
- Type or paste **text only**
- Use the rich text formatting toolbar
- Upload images separately
- Keep content under 100,000 characters

### ❌ DON'T:
- Paste images into the editor
- Copy from Word with images
- Paste from websites with images
- Use Ctrl+V for images

---

## 🔍 How to Check Content Size:

Look at the character count below the editor:
- **Under 100,000** = ✅ Good
- **100,000 - 500,000** = ⚠️ Large but OK
- **Over 500,000** = ❌ Too large (has images)

---

## 🎉 Ready to Go!

1. **Refresh the page** (Ctrl+R or F5)
2. Draft will be automatically cleared if too large
3. Start fresh with text-only content
4. Upload images separately
5. Save successfully!

---

**The system is now smart enough to prevent this issue automatically!**
