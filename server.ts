import "dotenv/config";
import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { trackEvent } from "./src/lib/tracking";
import nodemailer from "nodemailer";

const app = express();
const PORT = 3000;
const DB_FILE = path.join(process.cwd(), "shipments_db.json");

// Dynamic JSON database directory tracking
const loadShipmentsFromDb = (): any[] => {
  if (!fs.existsSync(DB_FILE)) {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify([]), "utf-8");
    } catch (err) {
      console.error("Critical: Failed to initialize shipments database file:", err);
    }
    return [];
  }
  try {
    const data = fs.readFileSync(DB_FILE, "utf-8");
    return JSON.parse(data) || [];
  } catch (err) {
    console.error("Warning: Error reading shipments from database file, using empty default:", err);
    return [];
  }
};

const saveShipmentsToDb = (shipments: any[]) => {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(shipments, null, 2), "utf-8");
  } catch (err) {
    console.error("Critical: Error writing shipments to database file:", err);
  }
};

async function start() {
  app.use(express.json({ limit: "15mb" }));

  // API Endpoints for unified logistics data tracking
  app.get("/api/shipments", async (req, res) => {
    try {
      const list = loadShipmentsFromDb();
      // Track read action silently
      trackEvent("read_shipments_db", { count: list.length }).catch(() => {});
      res.json(list);
    } catch (err) {
      res.status(500).json({ error: "Failed to read database records" });
    }
  });

  app.post("/api/shipments", async (req, res) => {
    try {
      const updatedList = req.body;
      if (!Array.isArray(updatedList)) {
        return res.status(400).json({ error: "Payload must be an array of shipments" });
      }
      saveShipmentsToDb(updatedList);
      // Track write action
      trackEvent("write_shipments_db", { count: updatedList.length }).catch(() => {});
      res.json(updatedList);
    } catch (err) {
      res.status(500).json({ error: "Failed to update database records" });
    }
  });

  // Central tracking proxy endpoint for client-side analytics telemetry
  app.post("/api/track", async (req, res) => {
    try {
      const { event_name, event_data } = req.body;
      if (!event_name) {
        return res.status(400).json({ error: "event_name is required in payload" });
      }
      const result = await trackEvent(event_name, event_data);
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: err?.message || String(err) });
    }
  });

  // Zoho SMTP Email Notification Endpoint for shipment updates & newsletter signup
  app.post("/api/send-email", async (req, res) => {
    try {
      const payload = req.body;
      if (!payload) {
        return res.status(400).json({ error: "Missing payload in request body" });
      }

      const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;

      // Handle newsletter_signup events specifically:
      if (payload.type === "newsletter_signup" || payload.event === "newsletter_signup" || payload.event_type === "newsletter_signup") {
        const subscriberEmail = payload.email;
        if (!subscriberEmail || !subscriberEmail.includes("@")) {
          return res.status(400).json({ error: "Invalid subscriber email address" });
        }

        // Fallback simulation if SMTP credentials are missing
        if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
          console.warn("[Email Service] Warning: Zoho SMTP credentials not fully configured in environment. Simulating newsletter subscription mails.");
          return res.json({
            success: true,
            simulated: true,
            message: `SMTP credentials not configured. Simulated newsletter emails for subscriber: ${subscriberEmail}`
          });
        }

        const transporter = nodemailer.createTransport({
          host: SMTP_HOST || 'smtp.zoho.com',
          port: Number(SMTP_PORT) || 465,
          secure: true,
          auth: {
            user: SMTP_USER,
            pass: SMTP_PASS
          },
          tls: {
            rejectUnauthorized: false
          }
        });

        // 1. Send a notification email TO 'ship@apextrackhub.com' stating "New Subscriber Joined: [subscriber email]".
        const adminMailOptions = {
          from: '"Apex Trans Shipments" <ship@apextrackhub.com>',
          to: 'ship@apextrackhub.com',
          subject: `New Subscriber Joined: ${subscriberEmail}`,
          text: `New Subscriber Joined: ${subscriberEmail}`,
          html: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; padding: 24px; background-color: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #0f172a; margin-top: 0; border-bottom: 2px solid #f59e0b; padding-bottom: 8px;">New Newsletter Subscriber</h2>
              <p style="color: #475569; font-size: 14px;">A visitor to our site has registered their email address to join the Apex Intermodal newsletter distribution list.</p>
              <div style="background-color: #f1f5f9; padding: 16px; border-radius: 8px; border-left: 4px solid #f59e0b; font-family: monospace; font-size: 14px; color: #0f172a;">
                <strong>New Subscriber Joined:</strong> ${subscriberEmail}
              </div>
              <p style="color: #64748b; font-size: 11px; margin-top: 24px; text-align: center;">Apex Operational Telemetry Dispatch</p>
            </div>
          `
        };

        // 2. Send a clean confirmation welcome email TO the subscriber from 'ship@apextrackhub.com'.
        const subscriberMailOptions = {
          from: '"Apex Trans Shipments" <ship@apextrackhub.com>',
          to: subscriberEmail,
          subject: 'Welcome to Apex Intermodal Logistics!',
          html: `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <title>Welcome to Apex Intermodal Logistics</title>
            </head>
            <body style="margin:0; padding:0; background-color:#f8fafc; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;">
              <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #f8fafc; padding: 20px 10px;">
                <tr>
                  <td align="center">
                    <table cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width: 600px; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
                      <tr>
                        <td style="background-color: #0f172a; padding: 24px; text-align: center; border-bottom: 3px solid #f59e0b;">
                          <h1 style="margin: 0; color: #f59e0b; font-size: 20px; font-weight: 800; letter-spacing: 0.05em; text-transform: uppercase;">APEX INTERMODAL LOGISTICS</h1>
                          <p style="margin: 4px 0 0 0; color: #94a3b8; font-size: 12px; text-transform: uppercase; letter-spacing: 0.1em;">Newsletter Subscription Confirmed</p>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 30px; text-align: left;">
                          <h2 style="margin-top: 0; color: #0f172a; font-size: 18px; font-weight: bold;">Subscription Confirmed!</h2>
                          <p style="color: #475569; font-size: 14px; line-height: 1.6; margin-bottom: 16px;">Thank you for subscribing to Apex Intermodal Logistics. Your email address has been registered to receive our exclusive container rate assessments, marine carrier alerts, customs clearance regulatory changes, and fuel surcharge index updates.</p>
                          <p style="color: #475569; font-size: 14px; line-height: 1.6; margin-bottom: 24px;">Our automated systems will deliver streamlined operational digests, keeping you fully informed about industry telemetry and port clearance flows.</p>
                          <div style="border-top: 1px solid #e2e8f0; padding-top: 20px; font-size: 12px; color: #64748b;">
                            Warm regards,<br>
                            <strong>Apex Trans Customer Success</strong><br>
                            <a href="mailto:ship@apextrackhub.com" style="color: #f59e0b; text-decoration: none;">ship@apextrackhub.com</a>
                          </div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </body>
            </html>
          `
        };

        // Fire both mail sends
        await transporter.sendMail(adminMailOptions);
        const info = await transporter.sendMail(subscriberMailOptions);
        console.log(`[Email Service] Success: Registered subscriber ${subscriberEmail} and dispatched emails via Zoho SMTP.`);
        return res.json({ success: true, messageId: info.messageId });
      }

      // Handle cargo alert registration events specifically:
      if (payload.type === "alert_registration" || payload.event === "alert_registration" || payload.event_type === "alert_registration") {
        const subscriberEmail = payload.email;
        const trackingId = payload.trackingId || "General";
        if (!subscriberEmail || !subscriberEmail.includes("@")) {
          return res.status(400).json({ error: "Invalid subscriber email address" });
        }

        // Fallback simulation if SMTP credentials are missing
        if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
          console.warn("[Email Service] Warning: Zoho SMTP credentials not fully configured. Simulating alert registration emails.");
          return res.json({
            success: true,
            simulated: true,
            message: `SMTP credentials not configured. Simulated alert registration emails for subscriber: ${subscriberEmail} on ID: ${trackingId}`
          });
        }

        const transporter = nodemailer.createTransport({
          host: SMTP_HOST || 'smtp.zoho.com',
          port: Number(SMTP_PORT) || 465,
          secure: true,
          auth: {
            user: SMTP_USER,
            pass: SMTP_PASS
          },
          tls: {
            rejectUnauthorized: false
          }
        });

        const adminMailOptions = {
          from: '"Apex Trans Shipments" <ship@apextrackhub.com>',
          to: 'ship@apextrackhub.com',
          subject: `Cargo Tracking Alert Registered: ${subscriberEmail}`,
          text: `A user registered for tracking alerts on tracking ID ${trackingId}.\nSubscriber Email: ${subscriberEmail}`,
          html: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; padding: 24px; background-color: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #0f172a; margin-top: 0; border-bottom: 2px solid #f59e0b; padding-bottom: 8px;">Telemetry Watcher Added</h2>
              <p style="color: #475569; font-size: 14px;">A user has registered their email to receive automatic dispatch status updates and port milestones.</p>
              <div style="background-color: #f1f5f9; padding: 16px; border-radius: 8px; font-family: monospace; font-size: 14px; color: #0f172a; line-height: 1.5;">
                <strong>Consignment ID:</strong> ${trackingId}<br>
                <strong>Recipient Email:</strong> ${subscriberEmail}
              </div>
              <p style="color: #64748b; font-size: 11px; margin-top: 24px; text-align: center;">Apex Operational Telemetry Dispatch</p>
            </div>
          `
        };

        const subscriberMailOptions = {
          from: '"Apex Trans Shipments" <ship@apextrackhub.com>',
          to: subscriberEmail,
          subject: `Tracking Alert Stream Connected - ${trackingId}`,
          html: `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <title>Apex Telemetry Alert Stream Connected</title>
            </head>
            <body style="margin:0; padding:0; background-color:#f8fafc; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;">
              <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #f8fafc; padding: 20px 10px;">
                <tr>
                  <td align="center">
                    <table cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width: 600px; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
                      <tr>
                        <td style="background-color: #0f172a; padding: 24px; text-align: center; border-bottom: 3px solid #f59e0b;">
                          <h1 style="margin: 0; color: #f59e0b; font-size: 20px; font-weight: 800; letter-spacing: 0.05em; text-transform: uppercase;">APEX INTERMODAL LOGISTICS</h1>
                          <p style="margin: 4px 0 0 0; color: #94a3b8; font-size: 12px; text-transform: uppercase; letter-spacing: 0.1em;">Alert Streaming Connected</p>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 30px; text-align: left;">
                          <h2 style="margin-top: 0; color: #0f172a; font-size: 18px; font-weight: bold;">Telemetry Alert Connected!</h2>
                          <p style="color: #475569; font-size: 14px; line-height: 1.6; margin-bottom: 16px;">We have successfully established a telemetry tracking subscription for shipment <strong>${trackingId}</strong>.</p>
                          <p style="color: #475569; font-size: 14px; line-height: 1.6; margin-bottom: 24px;">Automated carrier logs will stream notification digests to your email address whenever any transit milestones occur or critical delays are logged by dispatch controllers.</p>
                          <div style="border-top: 1px solid #e2e8f0; padding-top: 20px; font-size: 12px; color: #64748b;">
                            Warm regards,<br>
                            <strong>Apex Trans Customer Success</strong><br>
                            <a href="mailto:ship@apextrackhub.com" style="color: #f59e0b; text-decoration: none;">ship@apextrackhub.com</a>
                          </div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </body>
            </html>
          `
        };

        await transporter.sendMail(adminMailOptions);
        const info = await transporter.sendMail(subscriberMailOptions);
        console.log(`[Email Service] Success: Registered alert for subscriber ${subscriberEmail} on trackingId ${trackingId}.`);
        return res.json({ success: true, messageId: info.messageId });
      }

      // Handle default shipment update notification
      if (!payload.trackingId) {
        return res.status(400).json({ error: "Missing trackingId in request body payload" });
      }

      // Fallback log if SMTP credentials aren't configured yet
      if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
        console.warn("[Email Service] Warning: Zoho SMTP environment credentials not configured yet. Simulating successful shipment dispatch.");
        return res.json({
          success: true,
          simulated: true,
          message: "SMTP credentials not configured in environment. Detailed telemetry email logged to server logs.",
          recipient: payload.receiver?.email || "none"
        });
      }

      const {
        trackingId,
        status = "received",
        notes = "",
        shipper = {},
        receiver = {},
        cargoType = "",
        totalWeight = "",
        piecesCount = 1,
        dimensions = "",
        totalFreightCharge = "",
        payment_details = {}
      } = payload;

      // Status badges coloring styling helper
      let statusBg = "#e0f2fe";
      let statusColor = "#0369a1";
      if (status === "transit") {
        statusBg = "#fef3c7";
        statusColor = "#d97706";
      } else if (status === "delivered") {
        statusBg = "#dcfce7";
        statusColor = "#15803d";
      } else if (status === "held") {
        statusBg = "#fee2e2";
        statusColor = "#b91c1c";
      }

      // Payment status badge helper
      const payStatus = payment_details.payment_status || "Pending";
      let payStatusBg = "#f1f5f9";
      let payStatusColor = "#475569";
      if (payStatus === "Paid") {
        payStatusBg = "#dcfce7";
        payStatusColor = "#15803d";
      } else if (payStatus === "Refunded") {
        payStatusBg = "#fee2e2";
        payStatusColor = "#b91c1c";
      } else if (payStatus === "Pending") {
        payStatusBg = "#fef3c7";
        payStatusColor = "#d97706";
      }

      const transporter = nodemailer.createTransport({
        host: SMTP_HOST || 'smtp.zoho.com',
        port: Number(SMTP_PORT) || 465,
        secure: true,
        auth: {
          user: SMTP_USER,
          pass: SMTP_PASS
        },
        tls: {
          rejectUnauthorized: false
        }
      });

      // Formatted premium HTML email template matching the site design
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Apex Intermodal Logistics - Telemetry Update</title>
        </head>
        <body style="margin:0; padding:0; background-color:#f8fafc; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;">
          <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #f8fafc; padding: 20px 10px;">
            <tr>
              <td align="center">
                <table cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width: 600px; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
                  <!-- Header -->
                  <tr>
                    <td style="background-color: #0f172a; padding: 24px; text-align: center; border-bottom: 3px solid #f59e0b;">
                      <h1 style="margin: 0; color: #f59e0b; font-size: 20px; font-weight: 800; letter-spacing: 0.05em; text-transform: uppercase;">APEX INTERMODAL LOGISTICS</h1>
                      <p style="margin: 4px 0 0 0; color: #94a3b8; font-size: 12px; text-transform: uppercase; letter-spacing: 0.1em;">Shipment Confirmation & Telemetry Update</p>
                    </td>
                  </tr>
                  <!-- Content Body -->
                  <tr>
                    <td style="padding: 24px sm:padding: 32px;">
                      <p style="margin-top: 0; font-size: 15px; line-height: 1.5; color: #334155;">Hello,</p>
                      <p style="font-size: 14px; line-height: 1.5; color: #475569; margin-bottom: 24px;">Your shipment has been successfully recorded or updated in our telemetry log network. Please find the complete logistics itinerary and payment status details below.</p>
                      
                      <!-- Tracking Badge -->
                      <table cellpadding="12" cellspacing="0" border="0" width="100%" style="background-color: #f1f5f9; border: 1px solid #cbd5e1; border-radius: 8px; margin-bottom: 24px;">
                        <tr>
                          <td>
                            <span style="font-size: 10px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; display: block; margin-bottom: 2px;">Tracking Ref ID</span>
                            <span style="font-family: monospace; font-size: 16px; font-weight: bold; color: #0f172a;">${trackingId}</span>
                          </td>
                          <td align="right" valign="middle">
                            <span style="font-size: 10px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; display: block; margin-bottom: 4px;">Status</span>
                            <span style="display: inline-block; padding: 4px 10px; border-radius: 9999px; font-size: 11px; font-weight: bold; text-transform: uppercase; background-color: ${statusBg}; color: ${statusColor};">
                              ${status.replace(/_/g, ' ')}
                            </span>
                          </td>
                        </tr>
                      </table>

                      <!-- Routing Details -->
                      <h3 style="font-size: 12px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.05em; color: #475569; margin: 0 0 12px 0; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px;">Routing Details</h3>
                      <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom: 24px;">
                        <tr>
                          <td width="48%" valign="top" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px;">
                            <strong style="font-size: 10px; text-transform: uppercase; color: #64748b; display: block; margin-bottom: 4px;">Shipper</strong>
                            <div style="font-size: 13px; font-weight: bold; color: #0f172a;">${shipper.name || "N/A"}</div>
                            ${shipper.phone ? `<div style="font-size: 12px; color: #475569; margin-top: 2px;">${shipper.phone}</div>` : ""}
                            ${shipper.email ? `<div style="font-size: 12px; color: #475569;">${shipper.email}</div>` : ""}
                            ${shipper.address ? `<div style="font-size: 12px; color: #475569; margin-top: 4px; border-top: 1px dashed #e2e8f0; padding-top: 4px;">${shipper.address}</div>` : ""}
                          </td>
                          <td width="4%"></td>
                          <td width="48%" valign="top" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px;">
                            <strong style="font-size: 10px; text-transform: uppercase; color: #64748b; display: block; margin-bottom: 4px;">Receiver</strong>
                            <div style="font-size: 13px; font-weight: bold; color: #0f172a;">${receiver.name || "N/A"}</div>
                            ${receiver.phone ? `<div style="font-size: 12px; color: #475569; margin-top: 2px;">${receiver.phone}</div>` : ""}
                            ${receiver.email ? `<div style="font-size: 12px; color: #475569;">${receiver.email}</div>` : ""}
                            ${receiver.address ? `<div style="font-size: 12px; color: #475569; margin-top: 4px; border-top: 1px dashed #e2e8f0; padding-top: 4px;">${receiver.address}</div>` : ""}
                          </td>
                        </tr>
                      </table>

                      <!-- Cargo Specs & Payment Details -->
                      <h3 style="font-size: 12px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.05em; color: #475569; margin: 0 0 12px 0; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px;">Consignment & Payment</h3>
                      <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom: 24px;">
                        <tr>
                          <td width="48%" valign="top" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px;">
                            <strong style="font-size: 10px; text-transform: uppercase; color: #64748b; display: block; margin-bottom: 4px;">Cargo Specification</strong>
                            <div style="font-size: 12px; color: #334155; margin-bottom: 2px;"><strong>Type:</strong> ${cargoType || "General Cargo"}</div>
                            <div style="font-size: 12px; color: #334155; margin-bottom: 2px;"><strong>Weight:</strong> ${totalWeight || "N/A"} kg/lbs</div>
                            <div style="font-size: 12px; color: #334155; margin-bottom: 2px;"><strong>Pieces:</strong> ${piecesCount || 1}</div>
                            ${dimensions ? `<div style="font-size: 12px; color: #334155; margin-bottom: 2px;"><strong>Dimensions:</strong> ${dimensions}</div>` : ""}
                            ${totalFreightCharge ? `<div style="font-size: 12px; color: #334155; margin-top: 4px;"><strong>Freight Charge:</strong> <span style="font-family: monospace; font-weight: bold; color: #16a34a;">$${totalFreightCharge}</span></div>` : ""}
                          </td>
                          <td width="4%"></td>
                          <td width="48%" valign="top" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px;">
                            <strong style="font-size: 10px; text-transform: uppercase; color: #64748b; display: block; margin-bottom: 4px;">Payment Summary</strong>
                            <div style="font-size: 12px; color: #334155; margin-bottom: 4px;"><strong>Method:</strong> <span style="font-weight: bold; color: #0f172a;">${payment_details.payment_method || "N/A"}</span></div>
                            <div style="font-size: 12px; color: #334155; margin-bottom: 4px;">
                              <strong>Status:</strong>{' '}
                              <span style="display: inline-block; padding: 2px 6px; border-radius: 4px; font-size: 9px; font-weight: bold; text-transform: uppercase; background-color: ${payStatusBg}; color: ${payStatusColor};">
                                ${payStatus}
                              </span>
                            </div>
                            ${payment_details.transaction_id ? `<div style="font-size: 12px; color: #334155; margin-bottom: 2px;"><strong>Txn ID:</strong> <span style="font-family: monospace; font-size: 11px; background-color: #e2e8f0; padding: 1px 4px; border-radius: 4px;">${payment_details.transaction_id}</span></div>` : ""}
                            ${payment_details.payment_notes ? `<div style="font-size: 11px; color: #64748b; font-style: italic; margin-top: 6px; border-top: 1px dashed #e2e8f0; padding-top: 4px;">Notes: "${payment_details.payment_notes}"</div>` : ""}
                          </td>
                        </tr>
                      </table>

                      <!-- Notes Section -->
                      ${notes ? `
                        <h3 style="font-size: 12px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.05em; color: #475569; margin: 0 0 12px 0; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px;">Telemetry Dispatch Logs</h3>
                        <div style="background-color: #fffbeb; border: 1px solid #fef3c7; border-radius: 8px; padding: 12px; font-size: 12px; line-height: 1.5; color: #b45309; font-style: italic; margin-bottom: 16px;">
                          "${notes}"
                        </div>
                      ` : ""}
                      
                      <p style="font-size: 13px; color: #64748b; margin-top: 24px; margin-bottom: 0;">Need immediate assistance? Reach our dispatch operations desk or reply directly to this notification.</p>
                    </td>
                  </tr>
                  <!-- Footer -->
                  <tr>
                    <td style="background-color: #f1f5f9; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0;">
                      <p style="margin: 0; font-size: 11px; color: #64748b; font-weight: bold;">Apex Intermodal Logistics Hub</p>
                      <p style="margin: 2px 0 0 0; font-size: 10px; color: #94a3b8;">This is an automated operational system telemetry notification.</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `;

      // Recipients
      const recipients: string[] = ["ship@apextrackhub.com"];
      if (receiver.email && receiver.email.trim()) {
        recipients.push(receiver.email.trim());
      }

      const mailOptions = {
        from: '"Apex Trans Shipments" <ship@apextrackhub.com>',
        to: recipients.join(", "),
        subject: `[Apex Trans Log] Shipment Notification: ${trackingId} (${status.toUpperCase()})`,
        html: htmlContent
      };

      const info = await transporter.sendMail(mailOptions);
      console.log(`[Email Service] Success: Sent shipment notification for ${trackingId} to ${recipients.join(", ")}`);
      res.json({ success: true, messageId: info.messageId });
    } catch (error: any) {
      console.error("[Email Service] SMTP Transport Error:", error);
      res.status(500).json({ error: "Failed to transmit Zoho email notification", details: error?.message || String(error) });
    }
  });


  // Vite integration middleware
  if (process.env.NODE_ENV !== "production" && !process.env.VERCEL) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  // Only listen on PORT if not running in a Serverless / Vercel environment
  if (!process.env.VERCEL) {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`[Logistics Server] Active on port ${PORT}`);
    });
  }
}

start().catch((err) => {
  console.error("Critical failure during server startup:", err);
});

export default app;
