import { addSubscription } from "../../../../server1/metrics";

export async function POST(req) {
  const subscription = await req.json();
  addSubscription(subscription);

  return new Response(
    JSON.stringify({ message: "Subscription added successfully." }),
    { status: 201, headers: { "Content-Type": "application/json" } }
  );
}
