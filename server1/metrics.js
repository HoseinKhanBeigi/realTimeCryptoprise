import webPush from "web-push";

const publicVapidKey =
  "BNYriOvutQ9MKp4Nln_Ev7sf5akqH1N_rgn_lOXVpMuo4I-i8QmgVPL_N-_D8qNGew3Pb4rqC9X-_Xl2zc-sEQk";
const privateVapidKey = "rlZkPj5pokQsVLGuKZaojksZXOXj4YGoEqon6PaYO6M";

webPush.setVapidDetails(
  "mailto:your-email@example.com",
  publicVapidKey,
  privateVapidKey
);

let subscriptions = []; // Use a database in production

export function notifyOnHighVelocity(symbol, avgVelocity) {
  subscriptions.forEach((sub) => {
    webPush
      .sendNotification(
        sub,
        JSON.stringify({
          title: "High Velocity Alert",
          body: `Symbol: ${symbol.toUpperCase()} | Avg Velocity: ${avgVelocity.toFixed(
            2
          )}`,
        })
      )
      .catch((err) => console.error("Push Error:", err));
  });
}

export function calculateMetrics(data) {
  if (data.length < 2)
    return { velocities: [], totalChange: 0, avgVelocity: 0 };

  const velocities = [];
  let totalChange = 0;

  for (let i = 0; i < data.length - 1; i++) {
    const change = data[i + 1] - data[i];
    velocities.push(change);
    totalChange += change;
  }

  const totalTime = data.length - 1;
  const avgVelocity = totalTime > 0 ? totalChange / totalTime : 0;

  return { velocities, totalChange, avgVelocity };
}

export function addSubscription(subscription) {
  subscriptions.push(subscription);
  console.log("New subscription added:", subscription);
}
