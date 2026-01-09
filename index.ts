import 'dotenv/config';
import { Client, RichPresence } from 'discord.js-selfbot-v13';

interface ButtonsConfig {
    myuser: string;
    discord: string;
}

interface AppConfig {
    token: string;
    applicationId: string;
    streamUrl: string;
    presenceName: string;
    presenceState: string;
    statusMessages: string[];
    changeInterval: number;
    buttons: ButtonsConfig;
}

const CONFIG: AppConfig = {
    token: process.env.DISCORD_TOKEN as string,
    applicationId: process.env.APPLICATION_ID as string,
    streamUrl: process.env.STREAM_URL as string,
    presenceName: process.env.PRESENCE_NAME as string,
    presenceState: process.env.PRESENCE_STATE as string,
    statusMessages: (process.env.STATUS_MESSAGES || '').split(','),
    changeInterval: Number(process.env.CHANGE_INTERVAL) || 5000,
    buttons: {
        myuser: process.env.BUTTON_MYUSER as string,
        discord: process.env.BUTTON_DISCORD as string
    }
};

if (!CONFIG.token) {
    throw new Error('Missing DISCORD_TOKEN in environment variables');
}

const client = new Client();
let statusIndex = 0;

function updateRichPresence(): void {
    const status = CONFIG.statusMessages[statusIndex];

    try {
        const presence = new RichPresence(client)
            .setApplicationId(CONFIG.applicationId)
            .setType('STREAMING')
            .setURL(CONFIG.streamUrl)
            .setName(CONFIG.presenceName)
            .setDetails(status)
            .setState(CONFIG.presenceState)
            .setStartTimestamp(Date.now())
            .addButton('MyUser', CONFIG.buttons.myuser)
            .addButton('Discord', CONFIG.buttons.discord);

        client.user?.setPresence({
            activities: [presence],
            status: 'dnd'
        });

    } catch (err) {
        console.error('Failed to update presence:', err);
    }

    statusIndex = (statusIndex + 1) % CONFIG.statusMessages.length;
}

client.on('ready', () => {
    if (!client.user) return;

    console.log(`Selfbot connected as ${client.user.tag}`);

    setTimeout(() => {
        updateRichPresence();

        setInterval(updateRichPresence, CONFIG.changeInterval);
    }, 2000);
});

client.on('error', (error: Error) => {
    console.error('Client error:', error);
});

client.login(CONFIG.token).catch((error: Error) => {
    console.error('Login failed:', error);
});

process.on('SIGINT', () => {
    console.log('Shutting down...');
    client.destroy();
    process.exit(0);
});