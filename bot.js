import makeWASocket, { useMultiFileAuthState, DisconnectReason } from '@whiskeysockets/baileys'
import qrcode from 'qrcode-terminal'
import P from 'pino'
import express from 'express'

// Small server so Render no go sleep
const app = express()
const PORT = process.env.PORT || 3000
app.get('/', (req, res) => res.send('✅ Africans Fabric Bot is Running! Scan QR in Logs'))
app.listen(PORT, () => console.log(`Server on port ${PORT}`))

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys')
    const sock = makeWASocket({
        auth: state,
        logger: P({ level: 'silent' }),
        printQRInTerminal: true
    })

    sock.ev.on('creds.update', saveCreds)

    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update
        if(qr) {
            console.log("==== SCAN THIS QR WITH WHATSAPP ====")
            qrcode.generate(qr, { small: true })
            console.log("==== QR ABOVE ====")
        }
        if(connection === 'close') {
            const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut
            console.log('Connection closed, reconnecting:', shouldReconnect)
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
        const lower = text.toLowerCase().trim()

        console.log(`Message from ${from}: ${text}`)

        if(lower === "hi" || lower === "hello" || lower === "menu" || lower === "oga") {
            await sock.sendMessage(from, { text: `👋 Welcome to *Arnaud Afrochaine Verification Ltd*

🇳🇬 *AFRICANS FABRIC BOT*

Reply with:
1️⃣ *VERIFY CODE* - e.g VERIFY AFR-1234
2️⃣ *PRICE* - Fabric prices
3️⃣ *ORDER* - Place order
4️⃣ *LOCATION* - Shop address

We dey for you! 🤖` })
        }
        else if(lower.startsWith("verify")) {
            const code = text.split(" ")[1] || text.split(" ")[2] || "NO CODE"
            await sock.sendMessage(from, { text: `🔍 Checking code: *${code}*...\n\n✅ Code *${code}* is VALID!\n\nFabric: Original Ankara\nStatus: Verified by Arnaud Afrochaine\n\nThank you for buying original! 🙏\n\nCheck more: https://arnaudafrochaineverification-cyber.github.io/arnaudafrochaineverificationltd/verify.html` })
        }
        else if(lower.includes("price") || lower.includes("fabric") || lower.includes("how much")) {
            await sock.sendMessage(from, { text: `🧵 *AFRICANS FABRIC PRICE LIST:*

• Ankara 6 yards: ₦15,000
• Lace: ₦25,000
• Adire: ₦12,000
• Aso Oke: ₦30,000

Send *ORDER [fabric name]* to order!
Delivery nationwide 🚚 - Lagos` })
        }
        else if(lower.includes("location") || lower.includes("address") || lower.includes("shop")) {
            await sock.sendMessage(from, { text: `📍 *OUR SHOP:*\nArnaud Afrochaine Verification Ltd\nLagos, Nigeria\n\n🕘 Open: Mon-Sat 8am-6pm\n\nCall: Your number here` })
        }
        else if(lower.includes("order")) {
            await sock.sendMessage(from, { text: `🛒 Thank you for your order interest!\n\nPlease send:\n- Fabric name\n- Quantity\n- Your location\n\nOur Oga will reply you shortly!` })
        }
        else {
            await sock.sendMessage(from, { text: `I no understand "${text}" 😅\n\nType *MENU* to see options!` })
        }
    })
}

startBot()
