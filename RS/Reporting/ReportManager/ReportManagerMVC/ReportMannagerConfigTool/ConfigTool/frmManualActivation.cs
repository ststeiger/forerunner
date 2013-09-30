using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Data;
using System.Drawing;
using System.Linq;
using System.Text;
using System.Windows.Forms;

namespace ReportMannagerConfigTool
{
    public partial class frmManualActivation : Form
    {
        public frmManualActivation()
        {
            try
            {
                InitializeComponent();

                // It is assumed that the file "Manual Activation.rtf" is in the same folder as MobilizerConfigTool.exe
                richTxtBoxManualActivation.LoadFile("Manual Activation.rtf");
            }
            catch (Exception ex)
            {
                MessageBox.Show(ex.Message);
            }
        }

        private void richTxtBoxManualActivation_TextChanged(object sender, EventArgs e)
        {

        }

        private void frmManualActivation_Load(object sender, EventArgs e)
        {

        }
    }
}
