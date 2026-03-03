const TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJkYXRhIjp7ImlwIjoiMTE2LjYyLjQ4LjI4Iiwib3JnSWQiOjEwLCJ0ZWFtSWQiOjQyLCJ1c2VySWQiOjExMjZ9LCJleHAiOjE3NzI2ODk5MTcsImlhdCI6MTc3MjUxNzExNywibmJmIjoxNzcyNTE3MTE3fQ.yw6doMCoJKreNy29T56TmlQBmU2I6Rwdf0flPqEM_iE"
const BASE = "https://jzzm.duanju.com/gw"

const run = async () => {
  // Test 1: GET with query param
  console.log("=== GET with projectId=7026 ===")
  const r1 = await fetch(`${BASE}/storyboard/series/getSeries?projectId=7026`, {
    headers: { Authorization: `Bearer ${TOKEN}` },
  })
  console.log("Status:", r1.status)
  const d1 = await r1.text()
  console.log("Body:", d1.substring(0, 600))

  // Test 2: POST with JSON body
  console.log("\n=== POST with body {projectId:7026} ===")
  const r2 = await fetch(`${BASE}/storyboard/series/getSeries`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ projectId: 7026 }),
  })
  console.log("Status:", r2.status)
  const d2 = await r2.text()
  console.log("Body:", d2.substring(0, 600))
}

run().catch((e) => console.log("Error:", e.message))
