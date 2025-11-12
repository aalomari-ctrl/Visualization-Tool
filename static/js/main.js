d3.json("/api/data").then(data => {
  const svgWidth = 800, svgHeight = 450, margin = {top: 40, right: 80, bottom: 60, left: 70};
  const width = svgWidth - margin.left - margin.right;
  const height = svgHeight - margin.top - margin.bottom;

  const svg = d3.select("#chart")
    .append("svg")
    .attr("width", svgWidth)
    .attr("height", svgHeight);

  const chart = svg.append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  const x = d3.scaleLinear().range([0, width]);
  const yLeft = d3.scaleLinear().range([height, 0]); // Temperature
  const yRight = d3.scaleLinear().range([height, 0]); // CO2

  const xAxis = chart.append("g").attr("transform", `translate(0, ${height})`);
  const yAxisLeft = chart.append("g");
  const yAxisRight = chart.append("g").attr("transform", `translate(${width},0)`);

  const tempLine = d3.line()
    .x(d => x(d.year))
    .y(d => yLeft(d.temp_anomaly))
    .curve(d3.curveMonotoneX);

  const co2Line = d3.line()
    .x(d => x(d.year))
    .y(d => yRight(d.co2))
    .curve(d3.curveMonotoneX);

  // --- Rolling Mean function ---
  function rollingMean(values, windowSize = 2) {
    return values.map((d, i, arr) => {
      const start = Math.max(0, i - windowSize);
      const subset = arr.slice(start, i + 1);
      const mean = d3.mean(subset, v => v.temp_anomaly);
      return {...d, rolling: mean};
    });
  }

  function updateChart(region, maxYear) {
    const filtered = data.filter(d => d.continent === region && d.year <= maxYear);
    const smooth = rollingMean(filtered, 2);

    x.domain([1970, 2026]);
    yLeft.domain(d3.extent(data, d => d.temp_anomaly));
    yRight.domain(d3.extent(data, d => d.co2));

    xAxis.call(d3.axisBottom(x).tickFormat(d3.format("d")));
    yAxisLeft.call(d3.axisLeft(yLeft).ticks(6));
    yAxisRight.call(d3.axisRight(yRight).ticks(6));

    chart.selectAll(".line").remove();
    chart.selectAll(".label").remove();

    chart.append("path")
      .datum(filtered)
      .attr("class", "line temp")
      .attr("d", tempLine)
      .attr("stroke", "steelblue")
      .attr("fill", "none")
      .attr("stroke-width", 2);

    chart.append("path")
      .datum(smooth)
      .attr("class", "line smooth")
      .attr("d", d3.line()
        .x(d => x(d.year))
        .y(d => yLeft(d.rolling))
        .curve(d3.curveMonotoneX))
      .attr("stroke", "orange")
      .attr("fill", "none")
      .attr("stroke-dasharray", "5,3")
      .attr("stroke-width", 2);

    chart.append("path")
      .datum(filtered)
      .attr("class", "line co2")
      .attr("d", co2Line)
      .attr("stroke", "green")
      .attr("fill", "none")
      .attr("stroke-width", 2);

    chart.append("text")
      .attr("class", "label")
      .attr("x", width - 150)
      .attr("y", 20)
      .text(`${region} (≤ ${maxYear})`)
      .attr("font-weight", "bold");
  }

  // --- Interactivity ---
  const regionSelect = document.getElementById("region-select");
  const yearSlider = document.getElementById("year-range");
  const yearLabel = document.getElementById("year-label");

  function refresh() {
    yearLabel.textContent = `Up to ${yearSlider.value}`;
    updateChart(regionSelect.value, +yearSlider.value);
  }

  regionSelect.addEventListener("change", refresh);
  yearSlider.addEventListener("input", refresh);

  updateChart("Global", 2026);
});
