using System.Windows.Forms;

namespace ReportMannagerConfigTool
{
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
    }
}
