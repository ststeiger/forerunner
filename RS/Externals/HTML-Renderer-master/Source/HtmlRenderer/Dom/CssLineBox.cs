// "Therefore those skilled at the unorthodox
// are infinite as heaven and earth,
// inexhaustible as the great rivers.
// When they come to an end,
// they begin again,
// like the days and months;
// they die and are reborn,
// like the four seasons."
// 
// - Sun Tsu,
// "The Art of War"

using System;
using System.Collections.Generic;
using System.Drawing;

namespace HtmlRenderer.Dom
{
    /// <summary>
    /// Represents a line of text.
    /// </summary>
    /// <remarks>
    /// To learn more about line-boxes see CSS spec:
    /// http://www.w3.org/TR/CSS21/visuren.html
    /// </remarks>
    internal sealed class CssLineBox
    {
        #region Fields and Consts

        private readonly List<CssRect> _words;
        private readonly CssBox _ownerBox;
        private readonly Dictionary<CssBox, RectangleF> _rects;
        private readonly List<CssBox> _relatedBoxes;

        #endregion

        
        /// <summary>
        /// Creates a new LineBox
        /// </summary>
        public CssLineBox(CssBox ownerBox)
        {
            _rects = new Dictionary<CssBox, RectangleF>();
            _relatedBoxes = new List<CssBox>();
            _words = new List<CssRect>();
            _ownerBox = ownerBox;
            _ownerBox.LineBoxes.Add(this);
        }
        
        /// <summary>
        /// Gets a list of boxes related with the linebox. 
        /// To know the words of the box inside this linebox, use the <see cref="WordsOf"/> method.
        /// </summary>
        public List<CssBox> RelatedBoxes
        {
            get { return _relatedBoxes; }
        }

        /// <summary>
        /// Gets the words inside the linebox
        /// </summary>
        public List<CssRect> Words
        {
            get { return _words; }
        }

        /// <summary>
        /// Gets the owner box
        /// </summary>
        public CssBox OwnerBox
        {
            get { return _ownerBox; }
        }

        /// <summary>
        /// Gets a List of rectangles that are to be painted on this linebox
        /// </summary>
        public Dictionary<CssBox, RectangleF> Rectangles
        {
            get { return _rects; }
        }

        /// <summary>
        /// Get the height of this box line (the max height of all the words)
        /// </summary>
        public float LineHeight
        {
            get
            {
                float height = 0;
                foreach (var rect in _rects)
                {
                    height = Math.Max(height, rect.Value.Height);
                }
                return height;
            }
        }

        /// <summary>
        /// Get the bottom of this box line (the max bottom of all the words)
        /// </summary>
        public float LineBottom
        {
            get
            {
                float bottom = 0;
                foreach (var rect in _rects)
                {
                    bottom = Math.Max(bottom, rect.Value.Bottom);
                }
                return bottom;
            }
        }

        /// <summary>
        /// Lets the linebox add the word an its box to their lists if necessary.
        /// </summary>
        /// <param name="word"></param>
        internal void ReportExistanceOf(CssRect word)
        {
            if (!Words.Contains(word))
            {
                Words.Add(word);
            }

            if (!RelatedBoxes.Contains(word.OwnerBox))
            {
                RelatedBoxes.Add(word.OwnerBox);
            }
        }

        /// <summary>
        /// Return the words of the specified box that live in this linebox
        /// </summary>
        /// <param name="box"></param>
        /// <returns></returns>
        internal List<CssRect> WordsOf(CssBox box)
        {
            List<CssRect> r = new List<CssRect>();

            foreach (CssRect word in Words)
                if (word.OwnerBox.Equals(box)) r.Add(word);

            return r;
        }

        /// <summary>
        /// Updates the specified rectangle of the specified box.
        /// </summary>
        /// <param name="box"></param>
        /// <param name="x"></param>
        /// <param name="y"></param>
        /// <param name="r"></param>
        /// <param name="b"></param>
        internal void UpdateRectangle(CssBox box, float x, float y, float r, float b)
        {
            float leftspacing = box.ActualBorderLeftWidth + box.ActualPaddingLeft;
            float rightspacing = box.ActualBorderRightWidth + box.ActualPaddingRight;
            float topspacing = box.ActualBorderTopWidth + box.ActualPaddingTop;
            float bottomspacing = box.ActualBorderBottomWidth + box.ActualPaddingTop;

            if ((box.FirstHostingLineBox != null && box.FirstHostingLineBox.Equals(this)) || box.IsImage) x -= leftspacing;
            if ((box.LastHostingLineBox != null && box.LastHostingLineBox.Equals(this)) || box.IsImage) r += rightspacing;

            if (!box.IsImage)
            {
                y -= topspacing;
                b += bottomspacing;
            }
            

            if (!Rectangles.ContainsKey(box))
            {
                Rectangles.Add(box, RectangleF.FromLTRB(x, y, r, b));
            }
            else
            {
                RectangleF f = Rectangles[box];
                Rectangles[box] = RectangleF.FromLTRB(
                    Math.Min(f.X, x), Math.Min(f.Y, y),
                    Math.Max(f.Right, r), Math.Max(f.Bottom, b));
            }

            if (box.ParentBox != null && box.ParentBox.IsInline)
            {
                UpdateRectangle(box.ParentBox, x, y, r, b);
            }
        }

        /// <summary>
        /// Copies the rectangles to their specified box
        /// </summary>
        internal void AssignRectanglesToBoxes()
        {
            foreach (CssBox b in Rectangles.Keys)
            {
                b.Rectangles.Add(this, Rectangles[b]);
            }
        }

        /// <summary>
        /// Draws the rectangles for debug purposes
        /// </summary>
        /// <param name="g"></param>
        internal void DrawRectangles(Graphics g)
        {
            foreach (CssBox b in Rectangles.Keys)
            {
                if (float.IsInfinity(Rectangles[b].Width)) 
                    continue;
                g.FillRectangle(new SolidBrush(Color.FromArgb(50, Color.Black)),
                    Rectangle.Round(Rectangles[b]));
                g.DrawRectangle(Pens.Red, Rectangle.Round(Rectangles[b]));
            }
        }

        /// <summary>
        /// Gets the baseline Height of the rectangle
        /// </summary>
        /// <param name="b"> </param>
        /// <param name="g"></param>
        /// <returns></returns>
        public float GetBaseLineHeight(CssBox b, Graphics g)
        {
            Font f = b.ActualFont;
            FontFamily ff = f.FontFamily;
            FontStyle s = f.Style;
            return f.GetHeight(g) * ff.GetCellAscent(s) / ff.GetLineSpacing(s);
        }

        /// <summary>
        /// Sets the baseline of the words of the specified box to certain height
        /// </summary>
        /// <param name="g">Device info</param>
        /// <param name="b">box to check words</param>
        /// <param name="baseline">baseline</param>
        internal void SetBaseLine(IGraphics g, CssBox b, float baseline)
        {
            //TODO: Aqui me quede, checar poniendo "by the" con un font-size de 3em
            List<CssRect> ws = WordsOf(b);

            if (!Rectangles.ContainsKey(b)) return;

            RectangleF r = Rectangles[b];

            //Save top of words related to the top of rectangle
            float gap = 0f;

            if (ws.Count > 0)
            {
                gap = ws[0].Top - r.Top;
            }
            else
            {
                CssRect firstw = b.FirstWordOccourence(b, this);

                if (firstw != null)
                {
                    gap = firstw.Top - r.Top;
                }
            }

            //New top that words will have
            //float newtop = baseline - (Height - OwnerBox.FontDescent - 3); //OLD
            float newtop = baseline;// -GetBaseLineHeight(b, g); //OLD

            if (b.ParentBox != null &&
                b.ParentBox.Rectangles.ContainsKey(this) &&
                r.Height < b.ParentBox.Rectangles[this].Height)
            {
                //Do this only if rectangle is shorter than parent's
                float recttop = newtop - gap;
                RectangleF newr = new RectangleF(r.X, recttop, r.Width, r.Height);
                Rectangles[b] = newr;
                b.OffsetRectangle(this, gap);
            }
            
            foreach (var word in ws)
            {
                if (!word.IsImage)
                    word.Top = newtop;
            }
        }
        
        /// <summary>
        /// Check if the given word is the last selected word in the line.<br/>
        /// It can either be the last word in the line or the next word has no selection.
        /// </summary>
        /// <param name="word">the word to check</param>
        /// <returns></returns>
        public bool IsLastSelectedWord(CssRect word)
        {
            for(int i = 0; i < _words.Count-1; i++)
            {
                if( _words[i] == word )
                {
                    return !_words[i + 1].Selected;
                }
            }

            return true;
        }

        /// <summary>
        /// Returns the words of the linebox
        /// </summary>
        /// <returns></returns>
        public override string ToString()
        {
            string[] ws = new string[Words.Count];
            for (int i = 0; i < ws.Length; i++)
            {
                ws[i] = Words[i].Text;
            }
            return string.Join(" ", ws);
        }
    }
}
