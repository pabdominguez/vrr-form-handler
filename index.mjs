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
                        message: 'Todos los campos son requeridos: email, nombre, consulta'
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
                        message: 'Por favor, completa el reCAPTCHA'
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
                        message: 'Error de configuración del servidor'
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
                        message: 'Verificación de reCAPTCHA falló. Por favor, intenta de nuevo.'
                    })
                };
            }
            
            const msg = {
                to: process.env.TO_EMAIL || 'pablo@dolphintech.io',
                from: {
                    email: process.env.FROM_EMAIL,
                    name: 'LoreSalud - Formulario Web'
                },
                subject: `Nuevo mensaje de contacto de ${nombre}`,
                text: `
                    Nombre: ${nombre}
                    Email: ${email}
                    Consulta: ${consulta}
                `,
                html: `
                    <h3>Nuevo mensaje de contacto</h3>
                    <p><strong>Nombre:</strong> ${nombre}</p>
                    <p><strong>Email:</strong> ${email}</p>
                    <p><strong>Consulta:</strong></p>
                    <p>${consulta}</p>
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
                    message: 'Mensaje enviado exitosamente'
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
                    message: 'Error al enviar el mensaje'
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
