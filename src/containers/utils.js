import csvFile from "../data/wirelineData.csv";

function degreesToRadian(degrees) {
  return (degrees * Math.PI) / 180;
}

export function calcWellPathFromCsv(csvData) {
  /*
  source: https://orkustofnun.is/gogn/unu-gtp-report/UNU-GTP-2013-27.pdf
       
              A - Relative origin for the segment
              |\
              | \
              |  \
              | I \ measured depth = m_depth
     depth    |    \
              |     \
              |      \
              |       \
              |________\
                horizontal radius

                I = Inclination Angle
  
  for any segment: Before azimuth angle, horizontal radius will be: m_depth * sin(Inclination Angle)
  This distance has to be rotated by azimuth angle along with vertical axis pass through relative origin:
  that gives new cordinate of w.r.t. relative origin.
  x = radius * cos (azimuth_angle)
  y = radius * sin (azimuth_angle)
  to get final x, y we need to add relative origin to it, which is endpoint of previous segmentation.
  i.e  current_x = x + previous_x
        current_y =  y + previous_y
    
  for depth:
    segment_measured_depth = depth_measured_tll_end_of_segment - depth_till_previous_segment

    vertical_depth_of_segment = segment_measured_depth * cos(Inclination Angle)
    total_depth = previous_vertical_depth + vertical_depth_of_segment

  
  
  */
  let current_x = 0;
  let current_y = 0;
  let total_depth = 0;
  let prev_measured_depth = 0;
  const output = csvData.map((row, index) => {
    const segment_measured_depth =
      row["Measured depth (m)"] - prev_measured_depth;

    const inclination = row["Inclination (deg)"];
    const azimuth = row["Azimuth (deg)"];
    const density = row["Density (g/mL)"];

    const depth =
      segment_measured_depth * Math.cos(degreesToRadian(inclination));

    const radius =
      segment_measured_depth * Math.sin(degreesToRadian(inclination));

    current_x = current_x + radius * Math.cos(degreesToRadian(azimuth));
    current_y = current_y + radius * Math.sin(degreesToRadian(azimuth));
    total_depth = total_depth + depth;

    prev_measured_depth = row["Measured depth (m)"];

    return [current_x, current_y, total_depth, density];
  });
  return output;
}

export { csvFile };
