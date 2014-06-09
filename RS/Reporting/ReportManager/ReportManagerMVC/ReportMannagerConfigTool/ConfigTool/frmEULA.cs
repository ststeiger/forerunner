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
    public partial class frmEULA : Form
    {

        public frmEULA()
        {
            InitializeComponent();
            // It is assumed that the file "Manual Activation.rtf" is in the same folder as MobilizerConfigTool.exe
            txtEULA.LoadFile("Mobilizer License.rtf");
        }

        private void chkAgree_CheckedChanged(object sender, EventArgs e)
        {
            if (chkAgree.Checked)
                btnOK.Enabled = true;
            else
                btnOK.Enabled = false;
        }

        private void btnOK_Click(object sender, EventArgs e)
        {            
            this.Close();            
            DialogResult = DialogResult.OK;
        }

        private void frmEULA_Load(object sender, EventArgs e)
        {

        }
       
    }
}
