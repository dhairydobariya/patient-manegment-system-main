const twilio = require('twilio');

// Twilio credentials
const accountSid = process.env.TWILIO_ACCOUNT_SID; 
const authToken = process.env.TWILIO_AUTH_TOKEN; 
const client = twilio(accountSid, authToken);

// Create or retrieve a video session link using Twilio
exports.createTeleconsultationLink = async (appointmentId) => {
  try {
    // Check if the room already exists
    const existingRoom = await client.video.rooms.list({
      uniqueName: `teleconsultation-${appointmentId}`,
      limit: 1,
    });

    // If the room exists, return its SID
    if (existingRoom.length > 0) {
      return { message: 'Room exists', roomLink: existingRoom[0].sid };
    }

    // Create a new Twilio video room
    const room = await client.video.rooms.create({
      uniqueName: `teleconsultation-${appointmentId}`,
      type: 'group',
    });

    // Log the creation of the teleconsultation link
    console.log(`Teleconsultation link created for appointmentId: ${appointmentId}, Room SID: ${room.sid}`);

    // Return the video room URL
    return { message: 'Teleconsultation started', roomLink: `https://video.twilio.com/${room.sid}` };
  } catch (error) {
    throw new Error('Error creating teleconsultation link: ' + error.message);
  }
};
