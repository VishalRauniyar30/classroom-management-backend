import arcjet, { detectBot, shield, slidingWindow } from "@arcjet/node"

if (!process.env.ARCJET_KEY && process.env.ARCJET_ENV !== 'test') {
    throw new Error(
        "ARCJET_KEY environment variable is required. Sign up for your Arcjet key at https://app.arcjet.com"
    )
}

// Configure Arcjet with security rules.
const aj = arcjet({
    key: process.env.ARCJET_KEY!,
    rules: [
        shield({ mode: "LIVE" }),
        detectBot({
            mode: "LIVE",
            allow: [
                "CATEGORY:SEARCH_ENGINE", // Google, Bing, etc
                "CATEGORY:PREVIEW", // Link previews e.g. Slack, Discord
            ],
        }),
        slidingWindow({
            mode: "LIVE",
            interval: "2s", // Refill every 2 seconds
            max: 5, // Allow 5 requests per interval
        })
    ],
})

export default aj