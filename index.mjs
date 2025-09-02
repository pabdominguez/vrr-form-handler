import sgMail from '@sendgrid/mail';
import dotenv from 'dotenv';

dotenv.config();

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

export const handler = async (event) => {
    const path = event.rawPath || event.path;
    const method = event.requestContext?.http?.method || event.httpMethod;
    
    console.log('Request received:', { path, method });
    
    // CORS headers
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
        'Access-Control-Max-Age': '86400'
    };
    
    // Handle OPTIONS request for CORS preflight
    if (method === 'OPTIONS') {
        console.log('OPTIONS request, returning CORS headers');
        return {
            statusCode: 204,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
                'Access-Control-Max-Age': '86400',
                'Content-Type': 'text/plain'
            }
        };
    }
    
    if (path === '/contact' && method === 'POST') {
        try {
            const body = JSON.parse(event.body || '{}');
            const { email, nombre, consulta, recaptchaToken } = body;
            
            // Validate required fields
            if (!email || !nombre || !consulta) {
                return {
                    statusCode: 400,
                    headers: {
                        'Content-Type': 'application/json',
                        ...corsHeaders
                    },
                    body: JSON.stringify({
                        success: false,
                        message: 'All fields are required: email, name, inquiry'
                    })
                };
            }
            
            // Validate reCAPTCHA
            if (!recaptchaToken) {
                return {
                    statusCode: 400,
                    headers: {
                        'Content-Type': 'application/json',
                        ...corsHeaders
                    },
                    body: JSON.stringify({
                        success: false,
                        message: 'Please complete the reCAPTCHA'
                    })
                };
            }
            
            // Verify reCAPTCHA with Google
            const recaptchaSecret = process.env.RECAPTCHA_SECRET_KEY;
            if (!recaptchaSecret) {
                console.error('RECAPTCHA_SECRET_KEY not configured');
                return {
                    statusCode: 500,
                    headers: {
                        'Content-Type': 'application/json',
                        ...corsHeaders
                    },
                    body: JSON.stringify({
                        success: false,
                        message: 'Server configuration error'
                    })
                };
            }
            
            const recaptchaResponse = await fetch('https://www.google.com/recaptcha/api/siteverify', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: `secret=${recaptchaSecret}&response=${recaptchaToken}`
            });
            
            const recaptchaData = await recaptchaResponse.json();
            
            if (!recaptchaData.success) {
                console.error('reCAPTCHA verification failed:', recaptchaData);
                return {
                    statusCode: 400,
                    headers: {
                        'Content-Type': 'application/json',
                        ...corsHeaders
                    },
                    body: JSON.stringify({
                        success: false,
                        message: 'reCAPTCHA verification failed. Please try again.'
                    })
                };
            }
            
            const msg = {
                to: process.env.TO_EMAIL || 'pablo@dolphintech.io',
                from: {
                    email: process.env.FROM_EMAIL,
                    name: 'VRR - WEB FORM'
                },
                subject: `New contact message from ${nombre}`,
                text: `
                    Name: ${nombre}
                    Email: ${email}
                    Inquiry: ${consulta}
                `,
                html: `
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <meta charset="UTF-8">
                        <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    </head>
                    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
                        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 20px;">
                            <tr>
                                <td align="center">
                                    <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                                        <!-- Header -->
                                        <tr>
                                            <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 8px 8px 0 0;">
                                                <h1 style="margin: 0; color: #ffffff; font-size: 24px; text-align: center;">New Contact Form Submission</h1>
                                            </td>
                                        </tr>
                                        
                                        <!-- Content -->
                                        <tr>
                                            <td style="padding: 30px;">
                                                <p style="color: #666; margin: 0 0 20px 0; font-size: 16px;">You have received a new contact form submission from your website:</p>
                                                
                                                <!-- Contact Details -->
                                                <table width="100%" cellpadding="0" cellspacing="0">
                                                    <tr>
                                                        <td style="padding: 15px; background-color: #f8f9fa; border-left: 4px solid #667eea; margin-bottom: 10px;">
                                                            <p style="margin: 0 0 5px 0; color: #999; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Name</p>
                                                            <p style="margin: 0; color: #333; font-size: 16px; font-weight: 500;">${nombre}</p>
                                                        </td>
                                                    </tr>
                                                    <tr>
                                                        <td style="height: 10px;"></td>
                                                    </tr>
                                                    <tr>
                                                        <td style="padding: 15px; background-color: #f8f9fa; border-left: 4px solid #667eea; margin-bottom: 10px;">
                                                            <p style="margin: 0 0 5px 0; color: #999; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Email Address</p>
                                                            <p style="margin: 0; color: #333; font-size: 16px; font-weight: 500;">
                                                                <a href="mailto:${email}" style="color: #667eea; text-decoration: none;">${email}</a>
                                                            </p>
                                                        </td>
                                                    </tr>
                                                    <tr>
                                                        <td style="height: 10px;"></td>
                                                    </tr>
                                                    <tr>
                                                        <td style="padding: 15px; background-color: #f8f9fa; border-left: 4px solid #667eea;">
                                                            <p style="margin: 0 0 5px 0; color: #999; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Message</p>
                                                            <p style="margin: 0; color: #333; font-size: 16px; line-height: 1.5; white-space: pre-wrap;">${consulta}</p>
                                                        </td>
                                                    </tr>
                                                </table>
                                                
                                                <!-- Reply Button -->
                                                <table width="100%" cellpadding="0" cellspacing="0" style="margin-top: 30px;">
                                                    <tr>
                                                        <td align="center">
                                                            <a href="mailto:${email}" style="display: inline-block; padding: 12px 30px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; border-radius: 5px; font-weight: 500; font-size: 14px;">Reply to ${nombre}</a>
                                                        </td>
                                                    </tr>
                                                </table>
                                            </td>
                                        </tr>
                                        
                                        <!-- Footer -->
                                        <tr>
                                            <td style="padding: 20px; background-color: #f8f9fa; border-radius: 0 0 8px 8px; text-align: center;">
                                                <p style="margin: 0; color: #999; font-size: 12px;">This email was sent from your VRR website contact form</p>
                                                <p style="margin: 5px 0 0 0; color: #999; font-size: 12px;">Timestamp: ${new Date().toLocaleString()}</p>
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
            
            await sgMail.send(msg);
            
            return {
                statusCode: 200,
                headers: {
                    'Content-Type': 'application/json',
                    ...corsHeaders
                },
                body: JSON.stringify({
                    success: true,
                    message: 'Message sent successfully'
                })
            };
        } catch (error) {
            console.error('Error sending email:', error);
            return {
                statusCode: 500,
                headers: {
                    'Content-Type': 'application/json',
                    ...corsHeaders
                },
                body: JSON.stringify({
                    success: false,
                    message: 'Error sending message'
                })
            };
        }
    }
    
    return {
        statusCode: 404,
        headers: {
            'Content-Type': 'application/json',
            ...corsHeaders
        },
        body: JSON.stringify({
            success: false,
            message: 'Not Found'
        })
    };
};
