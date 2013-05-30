using System;
using System.IO;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Drawing;

namespace icongen
{
    public class StyleSheet
    {
        #region Public Functions

        public StyleSheet(int width, int height, String relativeUrlPath, String compositeImageClassName, List<String> imageClassNames)
        {
            iconWidth = width;
            iconHeight = height;
            compositeIconClassName = compositeImageClassName;
            iconClassNames = imageClassNames;
            relativePath = relativeUrlPath;
        }

        public void Save(String filePath)
        {
            if (File.Exists(filePath))
            {
                File.Delete(filePath);
            }

            // Open the style sheet file
            StreamWriter writer = new StreamWriter(filePath);

            // Write the composite icon class
            writer.WriteLine("/*** IconGen - start automatically generated, do not hand modify ***/");
            writer.WriteLine(".{0} {{\n  width:{1}px;\n  height:{2}px;\n  background-image:url('{3}');\n}}",
                compositeIconClassName, iconWidth, iconHeight, relativePath);

            double sqrtCount = Math.Sqrt(iconClassNames.Count);
            if (Math.Floor(sqrtCount) != sqrtCount)
            {
                // Any remainder and we need one more row / col
                sqrtCount++;
            }
            int iconCountX = Convert.ToInt32(Math.Floor(sqrtCount));
            int iconCountY = iconCountX;

            int imageWidth = iconCountX * iconWidth;
            int imageHeight = iconCountY * iconHeight;

            int curX = 0;
            int curY = 0;
            for (int i = 0; i < iconClassNames.Count; i++)
            {
                String yPos = "0", xPos = "0";
                if (curX != 0) xPos = "-" + curX.ToString() + "px";
                if (curY != 0) yPos = "-" + curY.ToString() + "px";
                writer.WriteLine("\n.{0} {{\n  background-position: {1} {2};\n}}", iconClassNames[i], xPos, yPos);

                curX += iconWidth;
                if (curX >= imageWidth)
                {
                    curY += iconHeight;
                    curX = 0;
                }
            }

            writer.WriteLine("/*** IconGen - end automatically generated, do not hand modify ***/\n");
            writer.Close();
        }

        #endregion

        #region Private data

        private List<String> iconClassNames;
        private String compositeIconClassName;
        private String relativePath;

        private int iconWidth;
        private int iconHeight;

        #endregion
    }
}
