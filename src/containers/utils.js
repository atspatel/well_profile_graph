import csvFile from "../data/wirelineData.csv";

function degreesToRadian(degrees) {
  return (degrees * Math.PI) / 180;
}

export function calcWellPathFromCsv(csvData) {
  let radius = 0;
  const output = csvData.map((row, index) => {
    const depth = row["Measured depth (m)"];
    const inclination = row["Inclination (deg)"];
    const azimuth = row["Azimuth (deg)"];
    const density = row["Density (g/mL)"];

    let depth_delta = 15;
    if (csvData[index + 1]) {
      depth_delta =
        csvData[index + 1]["Measured depth (m)"] - row["Measured depth (m)"];
    }
    radius = radius + depth_delta * Math.tan(degreesToRadian(inclination));
    const y = Math.round(radius * Math.sin(degreesToRadian(azimuth)), 2);
    const x = Math.round(radius * Math.cos(degreesToRadian(azimuth)), 2);
    return [x, y, Math.round(depth + depth_delta, 2), density];
  });
  return output;
}

export { csvFile };
