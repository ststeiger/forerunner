using System;
using System.Collections.Generic;
using System.Text;
using System;
using System.Drawing;
using System.Windows.Forms;
using System.Threading;
using System.IO;
using System.Reflection;

namespace Forerunner
{
    
    public class WebSiteThumbnail
    {
        private string HTML = null;      
        private Bitmap bmp = null;
        private byte[] MHTML = null; 

        public Bitmap Image 
        {
            get 
            { 
                return bmp; 
            } 
        }
        private ManualResetEvent mre = new ManualResetEvent(false);
        private WebBrowser webBrowser;
        private Func<string, string> callback = null;

        public static Bitmap GetStreamThumbnail(string HTML, Func<string, string> callback)
        {
            WebSiteThumbnail thumb = new WebSiteThumbnail(HTML, callback);
            Bitmap b = thumb.GetScreenShot();            
            return b;
        }
        public static Bitmap GetStreamThumbnail(byte[] MHTML)
        {
            WebSiteThumbnail thumb = new WebSiteThumbnail(MHTML);
            Bitmap b = thumb.GetScreenShot();            
            return b;
        }
        
        public WebSiteThumbnail(string HTML, Func<string, string> callback)
        {
            this.HTML = HTML;            
            this.callback = callback;
        }

        public WebSiteThumbnail(byte[] MHTML)
        {
            this.MHTML = MHTML;
            
        }
        public Bitmap GetScreenShot()
        {

            Thread t = new Thread(new ThreadStart(_GetScreenShot));
            t.SetApartmentState(ApartmentState.STA);
            t.Start();
            mre.WaitOne();            
            t.Abort();       
            return bmp;
        }
        
        private void _GetScreenShot()
        {
            webBrowser = new WebBrowser();
            webBrowser.ScrollBarsEnabled = false;
            string fileName = null;

            if (MHTML == null)
            {
                int length = 0;               
                webBrowser.Navigate("about:blank");
                webBrowser.Document.OpenNew(true);
                while (webBrowser.Document == null && webBrowser.Document.Body == null)
                    Application.DoEvents();
                webBrowser.Document.Write(this.HTML);
                foreach (HtmlElement he in webBrowser.Document.Images)
                {
                    string src = he.GetAttribute("src");
                    string s = callback(src);
                    he.SetAttribute("src", s);
                    length += s.Length;
                    if (length > 1024 * 10000) break;  //Limit the size
                }
                webBrowser.Document.Body.InnerHtml = webBrowser.Document.Body.InnerHtml;
                webBrowser.Update();
            }
            else
            {
                fileName = Path.GetTempPath() + Path.GetRandomFileName() + ".mht";
                System.IO.File.WriteAllBytes(fileName, MHTML);
                //webBrowser.Navigate(fileName);
                webBrowser.Url = new System.Uri(fileName);
                while ( webBrowser.ReadyState != WebBrowserReadyState.Complete )
                    Application.DoEvents();
            }
            
            SetIamge(webBrowser);
            if (fileName != null)
                File.Delete(fileName);
        }

        private void SetIamge(WebBrowser webBrowser)
        {
            
            int w = webBrowser.Document.Body.ScrollRectangle.Width;
            int h = webBrowser.Document.Body.ScrollRectangle.Height;
            if (h > 2000) h = 2000;  //Set an upper bound to limit the size
            if (w > 2000) w = 2000; //Set an upper bound to limit the size
            webBrowser.ClientSize = new Size(w,h );
            webBrowser.ScrollBarsEnabled = false;
            bmp = new Bitmap(w, h);
            
            webBrowser.BringToFront();
            webBrowser.DrawToBitmap(bmp, webBrowser.Bounds);
            webBrowser.Dispose();
            if (mre != null)
                mre.Set();
        }

    }
}
