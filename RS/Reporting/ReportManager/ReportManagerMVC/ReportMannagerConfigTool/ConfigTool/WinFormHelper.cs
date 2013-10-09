using System;
using System.Windows.Forms;
using System.Drawing;
using System.Text;
using System.Runtime.InteropServices;

namespace ReportMannagerConfigTool
{
    class CenterWinDialog : IDisposable
    {
        private int mTries = 0;
        private Form mOwner;

        public CenterWinDialog(Form owner)
        {
            mOwner = owner;
            owner.BeginInvoke(new MethodInvoker(findDialog));
        }

        private void findDialog()
        {
            // Enumerate windows to find the message box
            if (mTries < 0) return;
            EnumThreadWndProc callback = new EnumThreadWndProc(checkWindow);
            if (EnumThreadWindows(GetCurrentThreadId(), callback, IntPtr.Zero))
            {
                if (++mTries < 10) mOwner.BeginInvoke(new MethodInvoker(findDialog));
            }
        }
        private bool checkWindow(IntPtr hWnd, IntPtr lp)
        {
            // Checks if <hWnd> is a dialog
            StringBuilder sb = new StringBuilder(260);
            GetClassName(hWnd, sb, sb.Capacity);
            if (sb.ToString() != "#32770") return true;
            // Got it
            Rectangle frmRect = new Rectangle(mOwner.Location, mOwner.Size);
            RECT dlgRect;
            GetWindowRect(hWnd, out dlgRect);
            MoveWindow(hWnd,
                frmRect.Left + (frmRect.Width - dlgRect.Right + dlgRect.Left) / 2,
                frmRect.Top + (frmRect.Height - dlgRect.Bottom + dlgRect.Top) / 2,
                dlgRect.Right - dlgRect.Left,
                dlgRect.Bottom - dlgRect.Top, true);
            return false;
        }
        public void Dispose()
        {
            mTries = -1;
        }

        // P/Invoke declarations
        private delegate bool EnumThreadWndProc(IntPtr hWnd, IntPtr lp);
        [DllImport("user32.dll")]
        private static extern bool EnumThreadWindows(int tid, EnumThreadWndProc callback, IntPtr lp);
        [DllImport("kernel32.dll")]
        private static extern int GetCurrentThreadId();
        [DllImport("user32.dll")]
        private static extern int GetClassName(IntPtr hWnd, StringBuilder buffer, int buflen);
        [DllImport("user32.dll")]
        private static extern bool GetWindowRect(IntPtr hWnd, out RECT rc);
        [DllImport("user32.dll")]
        private static extern bool MoveWindow(IntPtr hWnd, int x, int y, int w, int h, bool repaint);
        private struct RECT { public int Left; public int Top; public int Right; public int Bottom; }
    }

    public class WinFormHelper
    {
        /// <summary>
        /// Verify the control empty or not in tab 'SSRS Connection'
        /// 
        /// For the first empty control will break the function and popup error.
        /// </summary>
        /// <returns></returns>
        public bool isTextBoxNotEmpty(Control container)
        {
            foreach (Control control in container.Controls)
            {
                if (control.Enabled && control is TextBox)
                {
                    var txt = (TextBox)control;
                    if (txt.Text.Trim().Equals(string.Empty))
                    {
                        showWarning(txt.Tag.ToString() + " can not be empty!");
                        return false;
                    }
                }
            }

            return true;
        }

        /// <summary>
        /// Show normal message
        /// </summary>
        /// <param name="message">message to show</param>
        public void showMessage(string message)
        {
            MessageBox.Show(message, "Notice", MessageBoxButtons.OK, MessageBoxIcon.Asterisk);
        }

        /// <summary>
        /// Show warning message with specific format
        /// </summary>
        /// <param name="message">warning message</param>
        public void showWarning(string message)
        {
            MessageBox.Show(message, "Warning", MessageBoxButtons.OK, MessageBoxIcon.Warning);
        }

        /// <summary>
        /// Get value from a TextBox control
        /// </summary>
        /// <param name="textbox">target control</param>
        /// <returns>text value after Trim()</returns>
        public string getTextBoxValue(TextBox textbox)
        {
            return textbox.Text.Trim();
        }

        /// <summary>
        /// Set textbox with a specific not empty value
        /// </summary>
        /// <param name="textbox">target textbox control</param>
        /// <param name="value">specific value</param>
        public void setTextBoxValue(TextBox textbox, string value)
        {
            if (value != "")
                textbox.Text = value;
        }

        public string getSelectRdoValue(GroupBox groupBox)
        {
            foreach(Control control in groupBox.Controls)
            {
                if (control is RadioButton)
                {
                    var rdo = control as RadioButton;
                    if (rdo.Checked)
                        return rdo.Tag.ToString();
                }
            }
            return string.Empty;
        }

        public void setSelectRdoValue(GroupBox groupBox, string value)
        {
            foreach (Control control in groupBox.Controls)
            {
                if (control is RadioButton)
                {
                    var rdo = control as RadioButton;
                    if (rdo.Tag.Equals(value))
                    {
                        rdo.Checked = true;
                        break;
                    }
                }
            }
        }
    }
}
