import { WebhookEvent } from '@clerk/nextjs/server';
import { headers } from 'next/headers';
import { supabase } from '@/app/lib/supabase';
import { createOrUpdateInternProfile } from '@/app/lib/user-profile';

export async function POST(req: Request) {
  try {
    // Get the headers
    const headersList = headers();
    const svix_id = headersList.get('svix-id');
    const svix_timestamp = headersList.get('svix-timestamp');
    const svix_signature = headersList.get('svix-signature');

    // If there are no svix headers, error out
    if (!svix_id || !svix_timestamp || !svix_signature) {
      return new Response('Error: Missing svix headers', {
        status: 400,
      });
    }

    // Get the body
    const payload = await req.json();
    const body = JSON.stringify(payload);

    // Get the webhook secret
    const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;
    
    if (!webhookSecret) {
      console.error('Error: Missing CLERK_WEBHOOK_SECRET');
      return new Response('Error: Missing CLERK_WEBHOOK_SECRET', {
        status: 500,
      });
    }

    // Verify the webhook (simplified for now)
    // In production, you should use the svix library for proper verification
    let evt: WebhookEvent;
    
    try {
      // For now, we'll just parse the payload
      evt = payload as WebhookEvent;
    } catch (err) {
      console.error('Error parsing webhook:', err);
      return new Response('Error parsing webhook', {
        status: 400,
      });
    }

    // Handle the webhook
    const eventType = evt.type;
    console.log(`Webhook received: ${eventType}`);

    if (eventType === 'user.created' || eventType === 'user.updated') {
      const { id, email_addresses, first_name, last_name } = evt.data;
      
      if (!id || !email_addresses || email_addresses.length === 0) {
        console.error('Missing required user data');
        return new Response('Missing required user data', { status: 400 });
      }

      try {
        // Create or update the intern profile in Supabase
        await createOrUpdateInternProfile({
          user_id: id,
          email: email_addresses[0].email_address,
          first_name: first_name || '',
          last_name: last_name || '',
        });

        console.log(`User ${id} synced to Supabase successfully`);
        return new Response(JSON.stringify({ success: true }), {
          status: 200,
        });
      } catch (error) {
        console.error('Error syncing user to Supabase:', error);
        return new Response('Error syncing user to Supabase', { status: 500 });
      }
    }

    return new Response('Webhook received', { status: 200 });
  } catch (error) {
    console.error('Unhandled error in webhook handler:', error);
    return new Response('Internal server error', { status: 500 });
  }
} 