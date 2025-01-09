import webPush from "web-push";

// Replace these with your VAPID keys (generate them using web-push)
const vapidKeys = webPush.generateVAPIDKeys();
console.log(vapidKeys);
const publicVapidKey =
  "BAfiDNNJZqGnhHhpLCHgkZTxQW2Wt3oIXrYalqlhuLlF_Owcms9QJU8UEh4FHfEWB9HFdQ_GYCuqIvuuiFV-3NU";
const privateVapidKey = "xkCZWk8cEOa2T4g-MG7enbRVrCftp6THGgCGAn9J4Pg";

webPush.setVapidDetails(
  "mailto:your-email@example.com",
  publicVapidKey,
  privateVapidKey
);

let subscriptions = []; // Store subscriptions (use a database for production)

export default function handler(req, res) {
  if (req.method === "POST") {
    const subscription = req.body;
    subscriptions.push(subscription);
    console.log("New subscription added:", subscription);
    res.status(201).json({ message: "Subscription added successfully." });
  } else if (req.method === "GET") {
    res.status(200).json({ publicVapidKey });
  } else {
    res.status(405).json({ message: "Method not allowed" });
  }
}
