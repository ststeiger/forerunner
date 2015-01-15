using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Data;
using System.Drawing;
using System.Linq;
using System.Text;
using System.Windows.Forms;
using System.Diagnostics;
using System.Data.SqlClient;

namespace ReportMannagerConfigTool
{
    public partial class frmDBLogin : Form
    {
        private WinFormHelper winform = new WinFormHelper();

        public frmDBLogin()
        {
            InitializeComponent();
        }

        private void btnCancel_Click(object sender, EventArgs e)
        {
            this.Close();
        }

        private void gbDBLoginInfo_Enter(object sender, EventArgs e)
        {

        }

        private void frmDBLogin_Load(object sender, EventArgs e)
        {

        }

        private void btnOK_Click(object sender, EventArgs e)
        {
            string result = "";

            if ( !winform.isTextBoxNotEmpty(gbDBLoginInfo))
                return;
            try
            {
                Cursor.Current = Cursors.WaitCursor;
               
                SqlConnectionStringBuilder builder = new SqlConnectionStringBuilder();
                builder.DataSource = winform.getTextBoxValue(txtServerName);
                builder.InitialCatalog = winform.getTextBoxValue(txtDBName);
                if (!rdoDomain.Checked)
                {
                    builder.UserID = winform.getTextBoxValue(txtUser);
                    builder.Password = winform.getTextBoxValue(txtPWD);
                }
                else
                {
                    builder.IntegratedSecurity = true;
                }

                System.Text.StringBuilder errorMessage = new System.Text.StringBuilder();
                

                result = ConfigToolHelper.UpdateSchema(builder.ConnectionString, winform.getTextBoxValue(txtUser), winform.getTextBoxValue(txtDomain), winform.getTextBoxValue(txtPWD), rdoDomain.Checked);

                winform.showMessage(result);
            }
            catch
            {
                Cursor.Current = Cursors.Default;
                winform.showWarning(StaticMessages.updateError);
            }
            Cursor.Current = Cursors.Default;
            if (result == "Success")
                this.Close();
        }

        private void rdoSQL_CheckedChanged(object sender, EventArgs e)
        {
            if (rdoSQL.Checked == true)
                txtDomain.Enabled = false;
            else
                txtDomain.Enabled = true;
        }
    }
}
