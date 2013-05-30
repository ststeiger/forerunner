using System;
using System.IO;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Drawing;

namespace icongen
{
    public class CompositeImage
    {
        #region Public properties

        public String IconFolder
        {
            get
            {
                return iconFolder;
            }
        }

        public List<String> IconFiles
        {
            get
            {
                return iconFiles;
            }
        }

        public int IconWidth
        {
            get
            {
                return iconWidth;
            }
        }

        public int IconHeight
        {
            get
            {
                return iconHeight;
            }
        }

        public int IconCountX
        {
            get
            {
                return iconCountX;
            }
        }

        public int IconCountY
        {
            get
            {
                return iconCountY;
            }
        }

        public Bitmap Image
        {
            get
            {
                return imageBitmap;
            }
        }

        public int ImageWidth
        {
            get
            {
                return imageWidth;
            }
        }

        public int ImageHeight
        {
            get
            {
                return imageHeight;
            }
        }

        #endregion

        #region Public Functions

        public CompositeImage(int width, int height, String imageFolder, List<String> imagefiles)
        {
            iconWidth = width;
            iconHeight = height;
            iconFolder = imageFolder;
            iconFiles = imagefiles;
        }

        public void Create()
        {
            double sqrtCount = Math.Sqrt(iconFiles.Count);
            if (Math.Floor(sqrtCount) != sqrtCount)
            {
                // Any remainder and we need one more row / col
                sqrtCount++;
            }
            iconCountX = Convert.ToInt32(Math.Floor(sqrtCount));
            iconCountY = iconCountX;

            imageWidth = iconCountX * iconWidth;
            imageHeight = iconCountY * iconHeight;

            // Defaults to Format32bppArgb PixelFormat
            imageBitmap = new Bitmap(imageWidth, imageHeight);
            Graphics graphics = Graphics.FromImage(imageBitmap);
            graphics.SmoothingMode = System.Drawing.Drawing2D.SmoothingMode.AntiAlias;
            graphics.InterpolationMode = System.Drawing.Drawing2D.InterpolationMode.HighQualityBilinear;

            int curX = 0;
            int curY = 0;
            for (int i = 0; i < iconFiles.Count; i++)
            {
                // Create a resized bitmap from the original image file
                String iconFilePath = Path.Combine(iconFolder, iconFiles[i]);
                Bitmap iconBitmap = new Bitmap(iconFilePath);

                // Composite the new icon bitmap into imageBitmap
                graphics.DrawImage(iconBitmap, curX, curY, iconWidth, iconHeight);
                curX += iconWidth;
                if (curX >= imageWidth)
                {
                    curY += iconHeight;
                    curX = 0;
                }
            }
        }

        public void Save(String filePath)
        {
            if (File.Exists(filePath))
            {
                File.Delete(filePath);
            }

            imageBitmap.Save(filePath);
        }

        #endregion

        #region Private data

        private List<String> iconFiles;
        private String iconFolder;
        
        private int iconWidth;
        private int iconHeight;
        private int iconCountX;
        private int iconCountY;

        Bitmap imageBitmap;
        private int imageWidth;
        private int imageHeight;
        
        #endregion
    }
}
