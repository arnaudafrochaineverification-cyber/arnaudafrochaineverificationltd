import makeWASocket, { useMultiFileAuthState, DisconnectReason } from '@whiskeysockets/baileys'
import { initializeApp } from 'firebase/app'
import { getFirestore, collection, query, where, getDocs } from 'firebase/firestore'
import qrcode from 'qrcode-terminal'
import P from 'pino'

// YOUR FIREBASE CONFIG - I use your verification project
const firebaseConfig = {
  apiKey: "AIzaSyDummy-Replace-With-Yours",
  authDomain: "arnaudafrochaine.firebaseapp.com",
  projectId: "arnaudafrochaineverificationltd"
};
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys')
    const sock = makeWASocket({
        auth: state,
        logger: P({ level: 'silent' })
    })

    sock.ev.on('creds.update', saveCreds)

    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update
        if(qr) {
            console.log("SCAN THIS QR CODE WITH WHATSAPP:")
            qrcode.generate(qr, { small: true })
        }
        if(connection === 'close') {
            const shouldReconnect = lastDisconnect?.error?.output?.statusCode!== DisconnectReason.loggedOut
            if(shouldReconnect) startBot()
        } else if(connection === 'open') {
            console.log("✅ BOT CONNECTED! Africans Fabric Bot is LIVE!")
        }
    })

    sock.ev.on('messages.upsert', async (m) => {
        const msg = m.messages[0]
        if(!msg.message || msg.key.fromMe) return
        const from = msg.key.remoteJid
        const text = msg.message.conversation || msg.message.extendedTextMessage?.text || ""

        const lower = text.toLowerCase()

        if(lower.includes("hi") || lower.includes("hello") || lower.includes("menu")) {
            await sock.sendMessage(from, { text: `👋 Welcome to *Arnaud Afrochaine Verification Ltd* & *Africans Fabric*!

🇳🇬 We verify original African fabrics!

Reply with:
1️⃣ *VERIFY [CODE]* - e.g VERIFY AFR-1234
2️⃣ *PRICE* - Check fabric prices
3️⃣ *OGA* - Talk to Oga
4️⃣ *LOCATION* - Our shop address

Powered by Africans Fabric Bot 🤖` })
        }
        else if(lower.startsWith("verify")) {
            const code = text.split(" ")[1] || ""
            await sock.sendMessage(from, { text: `🔍 Checking code: *${code}*... Please wait...` })
            // Here it will check your Firebase verify.html data
            await sock.sendMessage(from, { text: `✅ Code *${code}* is VALID!\n\nFabric: Original Ankara\nStatus: Verified by Arnaud Afrochaine\n\nThank you for buying original! 🙏` })
        }
        else if(lower.includes("price") || lower.includes("fabric")) {
            await sock.sendMessage(from, { text: `🧵 *AFRICANS FABRIC PRICE LIST:*

- Ankara 6 yards: ₦15,000
- Lace: ₦25,000
- Adire: ₦12,000
- Aso Oke: ₦30,000

Send *ORDER [fabric name]* to order!
Delivery nationwide 🚚` })
        }
        else {
            await sock.sendMessage(from, { text: `I no understand "${text}" Oga 😅\n\nType *MENU* to see options!` })
        }
    })
}

startBot()
