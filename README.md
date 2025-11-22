# MedConsult Liberia

A modern medical consultation website built with Next.js, TypeScript, Tailwind CSS, and MySQL.

## 🚀 Features

- **Responsive Design** - Beautiful, mobile-friendly interface
- **Contact Form** - Integrated with MySQL database
- **Appointment Booking** - API ready for appointment management
- **Partnership Opportunities** - Showcase collaboration options
- **Service Listings** - Display medical services offered
- **Modern Stack** - Next.js 16, TypeScript, Tailwind CSS

## 📋 Prerequisites

- Node.js 18+ installed
- MySQL server running locally
- npm or yarn package manager

## 🛠️ Installation

1. **Clone or navigate to the project:**
   ```bash
   cd /Users/mac/CascadeProjects/medconsult-liberia
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   
   Create a `.env.local` file in the root directory:
   ```env
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=your_mysql_password
   DB_NAME=medconsult_liberia
   ```

4. **Set up the database:**
   
   See [DATABASE_SETUP.md](./DATABASE_SETUP.md) for detailed instructions.
   
   Quick setup:
   ```sql
   CREATE DATABASE medconsult_liberia;
   USE medconsult_liberia;
   
   -- Run the SQL commands from DATABASE_SETUP.md
   ```

5. **Run the development server:**
   ```bash
   npm run dev
   ```

6. **Open your browser:**
   
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
medconsult-liberia/
├── app/
│   ├── api/
│   │   ├── contact/route.ts      # Contact form API
│   │   └── appointments/route.ts # Appointments API
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── Header.tsx
│   ├── Footer.tsx
│   ├── Hero.tsx
│   ├── About.tsx
│   ├── Services.tsx
│   ├── Partnerships.tsx
│   ├── Expertise.tsx
│   ├── Contact.tsx
│   └── CTA.tsx
├── lib/
│   ├── db.ts                     # MySQL connection pool
│   └── utils.ts
├── DATABASE_SETUP.md
└── README.md
```

## 🔌 API Endpoints

### Contact Form
- **POST** `/api/contact`
  - Submit contact messages
  - Saves to `contact_messages` table

### Appointments
- **POST** `/api/appointments`
  - Book appointments
  - Saves to `appointments` table

### Admin Access (Optional)
- **GET** `/api/contact` - View all contact messages
- **GET** `/api/appointments` - View all appointments

## 🎨 Customization

### Update Doctor Information
Edit `components/About.tsx` to update the doctor's name and biography.

### Modify Contact Details
Update contact information in:
- `components/Contact.tsx`
- `components/Footer.tsx`

### Change Colors
The primary color scheme uses Tailwind's `emerald-700`. To change:
- Search for `emerald-700` across components
- Replace with your preferred Tailwind color

## 🗄️ Database Schema

### contact_messages
- `id` - Auto-increment primary key
- `name` - Sender's name
- `email` - Sender's email
- `subject` - Message subject
- `message` - Message content
- `created_at` - Timestamp

### appointments
- `id` - Auto-increment primary key
- `name` - Patient name
- `email` - Patient email
- `phone` - Contact number
- `preferred_date` - Preferred appointment date
- `preferred_time` - Preferred appointment time
- `reason` - Appointment reason
- `status` - pending/confirmed/cancelled/completed
- `created_at` - Timestamp
- `updated_at` - Last update timestamp

## 🚢 Deployment

### Vercel (Recommended)
1. Push code to GitHub
2. Import project to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

### Other Platforms
Ensure your hosting platform supports:
- Node.js 18+
- MySQL database connection
- Environment variables

## 📝 License

This project is private and proprietary.

## 🤝 Support

For issues or questions, contact the development team.
