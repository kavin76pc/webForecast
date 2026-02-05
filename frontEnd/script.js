function predict() {
  const hour = document.getElementById("hour").value;
  const temp = document.getElementById("temp").value;

  fetch("http://localhost:8080/api/predict", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      hour: hour,
      temperature: temp,
    }),
  })
    .then((res) => res.json())
    .then((data) => {
      document.getElementById("result").innerText =
        "Predicted Demand: " + data.predictedDemand + " MW";
    });
}
