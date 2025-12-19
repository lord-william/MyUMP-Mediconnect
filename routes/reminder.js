const cron = require("node-cron");
const { createClient } = require("@supabase/supabase-js");
const sgMail = require('@sendgrid/mail')
require("dotenv").config();

// Initialize Supabase client
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function sendReminderEmail(email, appointmentTime) {
  // using Twilio SendGrid's v3 Node.js Library
// https://github.com/sendgrid/sendgrid-nodejs

sgMail.setApiKey(process.env.SENDGRID_API_KEY)
//sgMail.setDataResidency('eu'); 
// uncomment the above line if you are sending mail using a regional EU subuser

const msg = {
  to: email, // Change to your recipient
  from: 'khumalosibekezelo6@gmail.com', // Change to your verified sender
  subject: 'Appointment Confirmation',
  text: 'and easy to do anywhere, even with Node.js',
  html: `
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body {
            margin: 0;
            padding: 0;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: #f0f9ff;
            color: #333;
        }
        
        .email-container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }
        
        .header {
            background: linear-gradient(135deg, #059669 0%, #047857 100%);
            padding: 30px 40px;
            text-align: center;
            color: white;
            position: relative;
            overflow: hidden;
        }
        
        .header::before {
            content: '';
            position: absolute;
            top: -50%;
            right: -50%;
            width: 200%;
            height: 200%;
            background: radial-gradient(circle, rgba(255, 255, 255, 0.1) 0%, transparent 70%);
            z-index: 0;
        }
        
        .header-content {
            position: relative;
            z-index: 1;
        }
        
        .header-icon {
            width: 70px;
            height: 70px;
            background-color: rgba(255, 255, 255, 0.2);
            border-radius: 50%;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 20px;
            border: 3px solid rgba(255, 255, 255, 0.3);
        }
        
        .header h1 {
            margin: 0;
            font-size: 26px;
            font-weight: 600;
            letter-spacing: -0.5px;
        }
        
        .header .subtitle {
            margin: 8px 0 0 0;
            font-size: 16px;
            font-weight: 400;
            opacity: 0.9;
        }
        
        .content {
            padding: 40px;
        }
        
        .confirmation-badge {
            background: linear-gradient(135deg, #dcfdf7 0%, #a7f3d0 100%);
            border: 2px solid #6ee7b7;
            border-radius: 50px;
            padding: 12px 24px;
            display: inline-block;
            margin-bottom: 30px;
            color: #047857;
            font-weight: 600;
            font-size: 14px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        .appointment-card {
            background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
            border: 2px solid #93c5fd;
            border-radius: 16px;
            padding: 35px;
            margin: 25px 0;
            text-align: center;
            position: relative;
            overflow: hidden;
        }
        
        .appointment-card::before {
            content: '';
            position: absolute;
            top: -30%;
            left: -30%;
            width: 160%;
            height: 160%;
            background: radial-gradient(circle, rgba(59, 130, 246, 0.05) 0%, transparent 70%);
            z-index: 0;
        }
        
        .appointment-card-content {
            position: relative;
            z-index: 1;
        }
        
        .appointment-title {
            color: #1e40af;
            font-size: 20px;
            font-weight: 700;
            margin-bottom: 20px;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        
        .appointment-time {
            font-size: 32px;
            font-weight: 800;
            color: #2563eb;
            margin: 20px 0;
            text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            line-height: 1.2;
        }
        
        .confirmation-message {
            color: #059669;
            font-size: 18px;
            font-weight: 600;
            margin: 15px 0 5px 0;
        }
        
        .appointment-subtitle {
            color: #64748b;
            font-size: 14px;
            margin-top: 15px;
        }
        
        .success-message {
            background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
            border-left: 5px solid #10b981;
            padding: 25px;
            margin: 30px 0;
            border-radius: 0 12px 12px 0;
        }
        
        .success-message h3 {
            color: #047857;
            margin: 0 0 15px 0;
            font-size: 18px;
            font-weight: 700;
        }
        
        .success-message p {
            margin: 8px 0;
            color: #065f46;
            font-size: 15px;
            line-height: 1.6;
        }
        
        .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin: 30px 0;
        }
        
        .info-card {
            background-color: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 12px;
            padding: 20px;
            text-align: center;
        }
        
        .info-card h4 {
            color: #1e40af;
            margin: 0 0 10px 0;
            font-size: 14px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        .info-card p {
            margin: 0;
            color: #475569;
            font-size: 14px;
            line-height: 1.4;
        }
        
        .next-steps {
            background-color: #fef3c7;
            border: 2px solid #fbbf24;
            border-radius: 12px;
            padding: 25px;
            margin: 30px 0;
        }
        
        .next-steps h3 {
            color: #92400e;
            margin: 0 0 15px 0;
            font-size: 16px;
            font-weight: 600;
        }
        
        .next-steps ul {
            margin: 10px 0;
            padding-left: 20px;
            color: #78350f;
        }
        
        .next-steps li {
            margin: 8px 0;
            font-size: 14px;
            line-height: 1.5;
        }
        
        .cta-buttons {
            text-align: center;
            margin: 35px 0;
        }
        
        .btn {
            display: inline-block;
            padding: 14px 28px;
            margin: 0 10px;
            text-decoration: none;
            border-radius: 10px;
            font-weight: 600;
            font-size: 14px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            transition: all 0.3s ease;
        }
        
        .btn-primary {
            background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
            color: white;
            box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
        }
        
        .btn-primary:hover {
            background: linear-gradient(135deg, #1d4ed8 0%, #1e40af 100%);
            box-shadow: 0 6px 16px rgba(37, 99, 235, 0.4);
            transform: translateY(-2px);
        }
        
        .btn-secondary {
            background-color: transparent;
            color: #2563eb;
            border: 2px solid #2563eb;
        }
        
        .btn-secondary:hover {
            background-color: #2563eb;
            color: white;
            transform: translateY(-2px);
        }
        
        .calendar-add {
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            color: white;
            box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
        }
        
        .calendar-add:hover {
            background: linear-gradient(135deg, #059669 0%, #047857 100%);
            box-shadow: 0 6px 16px rgba(16, 185, 129, 0.4);
            transform: translateY(-2px);
        }
        
        .footer {
            background-color: #f1f5f9;
            padding: 30px 40px;
            text-align: center;
            border-top: 1px solid #cbd5e1;
        }
        
        .footer p {
            margin: 5px 0;
            color: #64748b;
            font-size: 13px;
            line-height: 1.4;
        }
        
        .footer .company-name {
            color: #2563eb;
            font-weight: 700;
        }
        
        @media (max-width: 600px) {
            .email-container {
                margin: 0;
                box-shadow: none;
            }
            
            .header, .content, .footer {
                padding: 20px;
            }
            
            .appointment-card {
                padding: 25px;
            }
            
            .appointment-time {
                font-size: 26px;
            }
            
            .info-grid {
                grid-template-columns: 1fr;
                gap: 15px;
            }
            
            .btn {
                display: block;
                margin: 10px 0;
            }
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="header">
            <div class="header-content">
                <div class="header-icon">
                    <svg width="35" height="35" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>
                    </svg>
                </div>
                <h1>Appointment Confirmed!</h1>
                <p class="subtitle">Your clinic appointment has been successfully scheduled</p>
            </div>
        </div>
        
        <div class="content">
            <div style="text-align: center;">
                <span class="confirmation-badge">✓ Confirmed</span>
            </div>
            
            <div class="success-message">
                <h3>Great! Your appointment is all set.</h3>
                <p>We've successfully scheduled your clinic appointment. You'll receive a reminder email 3 hours before your visit to help you prepare.</p>
            </div>
            
            <div class="appointment-card">
                <div class="appointment-card-content">
                    <div class="appointment-title">Appointment Details</div>
                    <div class="confirmation-message">Confirmed for</div>
                    <div class="appointment-time">${appointmentTime}</div>
                    <div class="appointment-subtitle">Please save this confirmation for your records</div>
                </div>
            </div>
            
        </div>
        
        <div class="footer">
            <p><span class="company-name">MediConnect</span></p>
            <p>UMP bld 7 2nd floor</p>
            <p>Phone: (555) 123-4567 | Fax: (555) 123-4568</p>
            <p>Email: appointments@mediconnect.com | Web: www.mediconnect.com</p>
            <p style="margin-top: 20px; font-size: 12px; color: #94a3b8;">
                This is an automated confirmation. Please save this email for your records.<br>
                © 2025 MediConnect. All rights reserved.
            </p>
        </div>
    </div>
</body>
</html>`,
}
sgMail
  .send(msg)
  .then(() => {
    console.log('Email sent')
  })
  .catch((error) => {
    console.error(error)
  })
}

// Run every 5 minutes
cron.schedule("*/5 * * * *", async () => {
  const now = new Date();
  const threeHoursFromNow = new Date(now.getTime() + 3 * 60 * 60 * 1000); // 3 hours ahead
  const fiveMinutesLater = new Date(threeHoursFromNow.getTime() + 5 * 60 * 1000); // 5 min window

  const start = threeHoursFromNow.toISOString();
  const end = fiveMinutesLater.toISOString();

  // Fetch appointments that are exactly 3 hours away
  const { data: upcomingAppointments, error } = await supabase
    .from("appointments")
    .select("*")
    .gte("appointment_time", start)
    .lte("appointment_time", end)
    .eq("reminders_sent", false);

  if (error) {
    console.error("Error fetching appointments:", error);
    return;
  }

  for (const appt of upcomingAppointments) {
    try {
      await sendReminderEmail(appt.email, appt.time);

      // Mark reminder as sent
      const { error: updateError } = await supabase
        .from("appointments")
        .update({ reminders_sent: true })
        .eq("id", appt.id);

      if (updateError) {
        console.error(`Failed to update appointment ${appt.id}:`, updateError);
      }
    } catch (err) {
      console.error(`Failed to send email for appointment ${appt.id}:`, err);
    }
  }
});
