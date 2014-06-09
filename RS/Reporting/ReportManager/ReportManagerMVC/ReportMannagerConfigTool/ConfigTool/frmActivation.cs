using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Data;
using System.Drawing;
using System.Linq;
using System.Text;
using System.Windows.Forms;
using ForerunnerLicense;
using ReportMannagerConfigTool;

namespace ReportMannagerConfigTool
{
    public partial class frmActivation : Form
    {
        public frmActivation()
        {
            InitializeComponent();
        }

        private void frmActivation_Load(object sender, EventArgs e)
        {

        }

        private void label1_Click(object sender, EventArgs e)
        {

        }


        private void cmdActivate_Click(object sender, EventArgs e)
        {
            if (txtActivationCode.Text == "")
            {
                using (new CenterWinDialog(this))
                {
                    MessageBox.Show(this, "Activate Result Required", "Forerunner Software Mobilizer");
                }
                return;
            }
            try
            {
                ClientLicense.ActivateFromResponce(ClientLicense.ProcessResponse(txtActivationCode.Text));
                using (new CenterWinDialog(this))
                {
                    MessageBox.Show(this, "License Activated", "Forerunner Software Mobilizer");                    
                }
            }
            catch (Exception ex)
            {
                Cursor.Current = Cursors.Default;
                using (new CenterWinDialog(this))
                {
                    MessageBox.Show(this, ex.Message, "Forerunner Software Mobilizer");
                }
            }
            
        }

        private void cmdValidate_Click(object sender, EventArgs e)
        {
             if (txtValidate.Text == "")
            {
                using (new CenterWinDialog(this))
                {
                    MessageBox.Show(this, "Validation Result Required", "Forerunner Software Mobilizer");
                }
                return;
            }
             try
             {
                 ClientLicense.ValidatefromResponce(ClientLicense.ProcessResponse(txtValidate.Text), true);
                 using (new CenterWinDialog(this))
                 {
                     MessageBox.Show(this, "License Verified", "Forerunner Software Mobilizer");
                 }
             }
             catch (Exception ex)
             {
                 Cursor.Current = Cursors.Default;
                 using (new CenterWinDialog(this))
                 {
                     MessageBox.Show(this, ex.Message, "Forerunner Software Mobilizer");
                 }
             }
             
        }

        private void cmdClose_Click(object sender, EventArgs e)
        {
            this.Close();
        }

        private void cmdGetActivation_Click_1(object sender, EventArgs e)
        {
            if (txtLicenseKey.Text == "")
            {
                using (new CenterWinDialog(this))
                {
                    MessageBox.Show(this, "LicenseKey Required", "Forerunner Software Mobilizer");
                }
                return;
            }
            Clipboard.SetText(ClientLicense.GetActivateString(txtLicenseKey.Text));
        }

        private void cmdGetValidateKey_Click(object sender, EventArgs e)
        {
           
            Clipboard.SetText(ClientLicense. GetValidateKey());        
        }
    }
}
