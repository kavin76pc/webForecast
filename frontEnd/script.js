function predict() {
  const place = document.getElementById("place").value.trim();
  if (!place) {
    updateResult({
      summary: "Please enter a place to generate a forecast.",
      highlights: [],
    });
    return;
  }

  fetch("http://localhost:8080/api/forecast", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      place: place,
    }),
  })
    .then((res) => res.json())
    .then((data) => {
      updateResult(data);
      updateChartImage(data.chartImageUrl);
      renderChart(data.series || []);
    });
}

function updateResult(data) {
  const summary = document.querySelector(".result__summary");
  const highlights = document.querySelector(".result__highlights");
  const headline = document.querySelector(".result__headline");
  const timestamp = document.getElementById("timestamp");

  headline.textContent = data.place
    ? `Forecast Summary — ${data.place}`
    : "Forecast Summary";
  summary.textContent = data.summary || "No summary available.";
  highlights.innerHTML = "";
  (data.highlights || []).forEach((item) => {
    const li = document.createElement("li");
    li.textContent = item;
    highlights.appendChild(li);
  });
  timestamp.textContent = data.generatedAt
    ? `Generated ${data.generatedAt}`
    : "";
}

function renderChart(series) {
  const canvas = document.getElementById("forecastChart");
  const ctx = canvas.getContext("2d");
  const image = document.getElementById("forecastImage");
  const width = canvas.width;
  const height = canvas.height;
  const padding = 40;

  if (!image.hasAttribute("hidden")) {
    canvas.classList.add("is-hidden");
    return;
  }

  canvas.classList.remove("is-hidden");
  ctx.clearRect(0, 0, width, height);

  if (!series.length) {
    ctx.fillStyle = "#9aa5b1";
    ctx.font = "16px sans-serif";
    ctx.fillText("Forecast chart will appear here.", padding, height / 2);
    return;
  }

  const demands = series.map((point) => point.demand);
  const minDemand = Math.min(...demands);
  const maxDemand = Math.max(...demands);

  const scaleX = (index) =>
    padding + (index / (series.length - 1)) * (width - padding * 2);
  const scaleY = (value) =>
    height -
    padding -
    ((value - minDemand) / (maxDemand - minDemand || 1)) *
      (height - padding * 2);

  ctx.strokeStyle = "#cbd5e1";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(padding, padding);
  ctx.lineTo(padding, height - padding);
  ctx.lineTo(width - padding, height - padding);
  ctx.stroke();

  ctx.strokeStyle = "#2563eb";
  ctx.lineWidth = 3;
  ctx.beginPath();
  series.forEach((point, index) => {
    const x = scaleX(index);
    const y = scaleY(point.demand);
    if (index === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  });
  ctx.stroke();

  ctx.fillStyle = "#1d2a3a";
  ctx.font = "12px sans-serif";
  series.forEach((point, index) => {
    if (index % 6 === 0 || index === series.length - 1) {
      const x = scaleX(index);
      const y = height - padding + 18;
      ctx.fillText(point.hour, x - 6, y);
    }
  });
}

function updateChartImage(imageUrl) {
  const image = document.getElementById("forecastImage");
  if (imageUrl) {
    image.src = imageUrl;
    image.removeAttribute("hidden");
    return;
  }
  image.setAttribute("hidden", "");
  image.removeAttribute("src");
}
