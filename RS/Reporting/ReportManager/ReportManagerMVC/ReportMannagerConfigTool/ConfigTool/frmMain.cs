using System;
using System.Data.SqlClient;
using System.Diagnostics;
using System.Windows.Forms;

namespace ReportMannagerConfigTool
{
    public partial class frmMain : Form
    {
        private ConfigToolHelper configTool;
        private WinFormHelper winform;

        public frmMain()
        {
            try
            {
                InitializeComponent();
                configTool = new ConfigToolHelper();
                winform = new WinFormHelper();

                LoadWebConfig();
                SetReportManagerFolderPath();
            }
            catch(Exception ex)
            {
                MessageBox.Show(ex.Message);
            }
        }

        #region Deploy Web Server
        //Deploy site to web server
        private void btnApplyWebServer_Click(object sender, EventArgs e)
        {
            #region Detect IIS or UWS is installed.
            if (rdoIIS.Checked)
            {
                if (!configTool.isIISInstalled())
                {
                    winform.showWarning(StaticMessages.iisNotInstall);
                    return;
                }
            }

            if (rdoUWS.Checked)
            {
                if (!configTool.isUWSInstalled())
                {
                    winform.showWarning(StaticMessages.uwsNotInstall);
                    return;
                }
            }
            #endregion

            if (txtSiteName.Text.Trim().Equals(string.Empty))
            {
                winform.showWarning(StaticMessages.siteEmpty);
                return;
            }

            if (txtPort.Text.Trim().Equals(string.Empty))
            {
                winform.showWarning(StaticMessages.portEmpty);
                return;
            }

            //if (!ReportManagerConfig.VerifyPortFree(ushort.Parse(txtPort.Text.Trim())))
            //{
            //    winform.showWarning(string.Format(StaticMessages.portNotFree,txtPort.Text.Trim()));
            //    return;
            //}

            try
            {
                string bindingAddress = string.Empty;
                string ip = configTool.GetLocIP();
                string localDirectory = System.IO.Directory.GetParent(System.IO.Directory.GetCurrentDirectory()).FullName;
                string siteName = txtSiteName.Text.Trim();
                string port = txtPort.Text.Trim();
                string siteUrl = "";

                //deploy site to IIS web server
                if (rdoIIS.Checked)
                {
                    if (ReportManagerConfig.VerifyIIsSiteNameExist(siteName))
                    {
                        winform.showWarning(string.Format(StaticMessages.siteExist, siteName));
                        return;
                    }

                    //ip:port:domain
                    bindingAddress = string.Format("{0}:{1}:{2}", "*", port, "");
                    ReportManagerConfig.CreateAnIISSite(siteName, localDirectory, bindingAddress, ref siteUrl);
                }
                //deploy site to UWS web server
                else if (rdoUWS.Checked)
                {
                    bindingAddress = string.Format("http://{0}:{1}", "*", port);
                    ReportManagerConfig.CreateAnUWSSite(siteName, localDirectory, bindingAddress, ref siteUrl);
                }
                winform.showMessage(string.Format(StaticMessages.deploySuccess, (rdoIIS.Checked ? "IIS " : "UWS")));
            }
            catch (Exception ex)
            {
                winform.showWarning("Error:" + ex.Message);
            }
        }

        //open the site by default browser
        private void btnTestWeb_Click(object sender, EventArgs e)
        {
             Process.Start("http://localhost:" + txtPort.Text.Trim() + "/" + txtSiteName.Text.Trim());
        }
        #endregion

        #region SSRS Connection
        private void LoadWebConfig()
        {
            var existConfig = ReportManagerConfig.GetForerunnerWebConfig();

            winform.setTextBoxValue(txtWSUrl, existConfig["WSUrl"]);
            winform.setTextBoxValue(txtServerName , existConfig["DataSource"]);
            winform.setTextBoxValue(txtDBName, existConfig["Database"]);
            winform.setTextBoxValue(txtDomain, existConfig["UserDomain"]);
            winform.setTextBoxValue(txtUser, existConfig["User"]);
            winform.setTextBoxValue(txtPWD, Forerunner.SSRS.Security.Encryption.Decrypt(existConfig["Password"]));
            winform.setSelectRdoValue(gbDBLoginInfo, existConfig["DBAccountType"]);
            winform.setSelectRdoValue(gbAuthType, existConfig["AuthType"]);
        }

        private void SetReportManagerFolderPath()
        {
            txtReportServer.Text = RenderExtensionConfig.ReprotManagerFolderPath;
        }

        private void btnTest_Click(object sender, EventArgs e)
        {
            if (!winform.isTextBoxNotEmpty(tabPage2))
                return;

            SqlConnectionStringBuilder builder = new SqlConnectionStringBuilder();
            builder.DataSource = winform.getTextBoxValue(txtServerName);
            builder.InitialCatalog = winform.getTextBoxValue(txtDBName);
            if (rdoDomain.Checked)
            {
                builder.UserID = winform.getTextBoxValue(txtDomain) + "\\" + winform.getTextBoxValue(txtUser);
            }
            else
            {
                builder.UserID = winform.getTextBoxValue(txtUser);
            }

            builder.Password = winform.getTextBoxValue(txtPWD);

            string result = configTool.tryConnectDB(builder.ConnectionString);
            if (result.Equals("True"))
                winform.showMessage(StaticMessages.connectDBSuccess);
            else
                MessageBox.Show(result);
        }

        private void btnApply_Click(object sender, EventArgs e)
        {
            if (!winform.isTextBoxNotEmpty(tabPage2))
                return;
            try
            {
                ReportManagerConfig.UpdateForerunnerWebConfig(winform.getTextBoxValue(txtWSUrl), winform.getTextBoxValue(txtServerName),
                    winform.getTextBoxValue(txtDBName), winform.getTextBoxValue(txtDomain),
                    winform.getTextBoxValue(txtUser), Forerunner.SSRS.Security.Encryption.Encrypt(winform.getTextBoxValue(txtPWD)),
                    winform.getSelectRdoValue(gbDBLoginInfo),winform.getSelectRdoValue(gbAuthType));
                
                winform.showMessage(StaticMessages.ssrsUpdateSuccess);
            }
            catch
            {
                winform.showWarning(StaticMessages.updateError);
            }
        }

        private void rdoSQL_CheckedChanged(object sender, EventArgs e)
        {
            if (rdoSQL.Checked == true)
                txtDomain.Enabled = false;
            else
                txtDomain.Enabled = true;
        }
        #endregion

        #region SSRS Extension
        private void btnFolderBrowser_Click(object sender, EventArgs e)
        {
            folderSSRS.ShowDialog();
            if (!folderSSRS.SelectedPath.Trim().Equals(string.Empty))
                txtReportServer.Text = folderSSRS.SelectedPath;
        }

        private void btnRemoveEx_Click(object sender, EventArgs e)
        {
            string targetPath = winform.getTextBoxValue(txtReportServer);
            if (targetPath.Equals(string.Empty))
            {
                winform.showWarning(StaticMessages.reportServerPathEmpty);
                return;
            }

            if (RenderExtensionConfig.VerifyReportServerPath(targetPath))
            {
                DialogResult dialogResult = MessageBox.Show(StaticMessages.removeExtension, StaticMessages.removeCaption, MessageBoxButtons.YesNo, MessageBoxIcon.Question);
                if (dialogResult == DialogResult.Yes)
                {
                    RenderExtensionConfig.removeRenderExtension(targetPath);
                }
            }
            else
            {
                winform.showWarning(StaticMessages.reportServerPathWrong);
                return;
            }
        }

        private void btnAddEx_Click(object sender, EventArgs e)
        {            
            string targetPath = winform.getTextBoxValue(txtReportServer);
            if (targetPath.Equals(string.Empty))
            {
                winform.showWarning(StaticMessages.reportServerPathEmpty);
                return;
            }

            if (RenderExtensionConfig.VerifyReportServerPath(targetPath))
            {
                RenderExtensionConfig.addRenderExtension(targetPath);
                RenderExtensionConfig.ReprotManagerFolderPath = targetPath;
            }
            else
            {
                winform.showWarning(StaticMessages.reportServerPathWrong);
                return;
            }
        }
        #endregion

        private void btnInstallUWS_Click(object sender, EventArgs e)
        {
            Process.Start("UltiDev.WebServer.msi");
        }
    }
}
