using System;
using System.Data.SqlClient;
using System.Diagnostics;
using System.Windows.Forms;
using ForerunnerLicense;


namespace ReportMannagerConfigTool
{
    public partial class frmMain : Form
    {
        private WinFormHelper winform;

        public frmMain()
        {
            try
            {
                InitializeComponent();
                winform = new WinFormHelper();

                LoadWebConfig();
                SetReportManagerFolderPath();
                LoadWebServerConfig();
                rtbCurLicense.Text = ClientLicense.GetLicenseString();
            }
            catch(Exception ex)
            {
                MessageBox.Show(this, ex.Message, "Forerunner Software Mobilizer");
            }
        }

        #region Deploy Web Server
        //Deploy site to web server
        private void btnApplyWebServer_Click(object sender, EventArgs e)
        {
            #region Detect IIS or UWS is installed.
            if (rdoIIS.Checked)
            {
                if (!ConfigToolHelper.isIISInstalled())
                {
                    winform.showWarning(StaticMessages.iisNotInstall);
                    return;
                }
            }

            if (rdoUWS.Checked)
            {
                if (!ConfigToolHelper.isUWSInstalled())
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
            Cursor.Current = Cursors.WaitCursor;
            try
            {
                string bindingAddress = string.Empty;
                string ip = ConfigToolHelper.GetLocIP();
                string localDirectory = System.IO.Directory.GetParent(System.IO.Directory.GetCurrentDirectory()).FullName;
                string siteName = txtSiteName.Text.Trim();
                string port = txtPort.Text.Trim();
                string siteUrl = "";
                string authType = string.Empty;
                
                if (rdoFormAuth.Checked)
                {
                    authType = StaticMessages.formsAuth;
                }
                else if (rdoWinAuth.Checked)
                {
                    authType = StaticMessages.windowsAuth;
                }

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
                    ReportManagerConfig.CreateAnIISSite(siteName, localDirectory, bindingAddress, ref siteUrl, authType);
                }
                //deploy site to UWS web server
                else if (rdoUWS.Checked)
                {
                    bindingAddress = string.Format("http://{0}:{1}", "*", port);
                    ReportManagerConfig.CreateAnUWSSite(siteName, localDirectory, bindingAddress, ref siteUrl, authType);
                }
                SaveWebServerConfig();
                ConfigToolHelper.SetLogFilesFolderPermission(rdoIIS.Checked);
                winform.showMessage(string.Format(StaticMessages.deploySuccess, (rdoIIS.Checked ? "IIS " : "UWS")));
            }
            catch (Exception ex)
            {
                Cursor.Current = Cursors.Default;
                winform.showWarning("Error:" + ex.Message);
            }
            Cursor.Current = Cursors.WaitCursor;
        }

        //open the site by default browser
        private void btnTestWeb_Click(object sender, EventArgs e)
        {
            Process.Start("http://localhost:" + (rdoIIS.Checked ? "80" : txtPort.Text.Trim()) + "/" + txtSiteName.Text.Trim());
        }

        private void SaveWebServerConfig()
        {
            WebServerConfig.ServerType = rdoIIS.Checked ? "IIS" : "UWS";
            WebServerConfig.SiteName = winform.getTextBoxValue(txtSiteName);
            WebServerConfig.Port = winform.getTextBoxValue(txtPort);
        }

        private void LoadWebServerConfig() 
        {
            if (!String.Empty.Equals(WebServerConfig.ServerType))
            {
                if ("IIS".Equals(WebServerConfig.ServerType))
                    rdoIIS.Checked = true;
                else
                    rdoUWS.Checked = true;
            }
            winform.setTextBoxValue(txtSiteName, WebServerConfig.SiteName);
            winform.setTextBoxValue(txtPort, WebServerConfig.Port);
        }
        #endregion

        #region SSRS Connection
        private void LoadWebConfig()
        {
            var savedConfig = ReportManagerConfig.GetForerunnerWebConfig();

            winform.setTextBoxValue(txtWSUrl, savedConfig["WSUrl"]);
            winform.setTextBoxValue(txtServerName , savedConfig["DataSource"]);
            winform.setTextBoxValue(txtDBName, savedConfig["Database"]);
            winform.setTextBoxValue(txtDomain, savedConfig["UserDomain"]);
            winform.setTextBoxValue(txtUser, savedConfig["User"]);
            winform.setTextBoxValue(txtPWD, Forerunner.SSRS.Security.Encryption.Decrypt(savedConfig["Password"]));

            if (savedConfig["SQLIntegrated"].ToLower() == "true")
                rdoDomain.Checked = true;
            else
                rdoSQL.Checked = true;

            if (savedConfig["IsNative"].ToLower() == "false")
                chkSharepoint.Checked = true;
            else
                chkSharepoint.Checked = false;

            winform.setTextBoxValue(txtSharePointHostName, savedConfig["SharePointHostName"]);
            winform.setTextBoxValue(txtDefaultUserDomain, savedConfig["DefaultUserDomain"]);
            winform.setSelectRdoValue(gbAuthType, savedConfig["AuthType"]);
        }

        private void SetReportManagerFolderPath()
        {
            txtReportServer.Text = RenderExtensionConfig.ReprotManagerFolderPath;
        }

        private void btnTest_Click(object sender, EventArgs e)
        {
            if (!winform.isTextBoxNotEmpty(gbDBLoginInfo))
                return;

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

            Cursor.Current = Cursors.Default;
            System.Text.StringBuilder errorMessage = new System.Text.StringBuilder();
            string result;

            //Test database connection
            if (rdoDomain.Checked)
                result = ConfigToolHelper.tryConnectDBIntegrated(builder.ConnectionString, winform.getTextBoxValue(txtUser), winform.getTextBoxValue(txtDomain), winform.getTextBoxValue(txtPWD));
            else
                result = ConfigToolHelper.tryConnectDB(builder.ConnectionString);

            if (!StaticMessages.testSuccess.Equals(result))
            {
                errorMessage.AppendLine(result);
                errorMessage.AppendLine();
            }

            //Test web service url connection
            result = ConfigToolHelper.tryWebServiceUrl(chkSharepoint.Checked, winform.getTextBoxValue(txtWSUrl));
            if (!StaticMessages.testSuccess.Equals(result))
            {
                errorMessage.AppendLine(result);
            }

            if (errorMessage.Length != 0)
            {
                winform.showWarning(errorMessage.ToString());
                return;
            }
            winform.showMessage(StaticMessages.connectDBSuccess);
        }

        private void btnApply_Click(object sender, EventArgs e)
        {
            if (!winform.isTextBoxNotEmpty(gbSSRS) || !winform.isTextBoxNotEmpty(gbDBLoginInfo))
                return;
            try
            {
                Cursor.Current = Cursors.WaitCursor;
                ReportManagerConfig.UpdateForerunnerWebConfig(winform.getTextBoxValue(txtWSUrl), winform.getTextBoxValue(txtServerName),
                    winform.getTextBoxValue(txtDBName), winform.getTextBoxValue(txtDomain),
                    winform.getTextBoxValue(txtUser), Forerunner.SSRS.Security.Encryption.Encrypt(winform.getTextBoxValue(txtPWD)),
                    rdoDomain.Checked ? true : false, chkSharepoint.Checked ? false : true, winform.getTextBoxValue(txtSharePointHostName),
                    winform.getTextBoxValue(txtDefaultUserDomain));
                
                winform.showMessage(StaticMessages.ssrsUpdateSuccess);
            }
            catch
            {
                Cursor.Current = Cursors.Default;
                winform.showWarning(StaticMessages.updateError);
            }
            Cursor.Current = Cursors.Default;
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

        //Remove forerunner ssrs extension
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
                    ConfigToolHelper.StartReportServer(false, targetPath);
                    RenderExtensionConfig.removeRenderExtension(targetPath);
                    ConfigToolHelper.StartReportServer(true, targetPath);
                    winform.showMessage(StaticMessages.removeDone);
                }
            }
            else
            {
                winform.showWarning(StaticMessages.reportServerPathWrong);
                return;
            }
        }

        //Add forerunner ssrs extension
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
                ConfigToolHelper.StartReportServer(false, targetPath);
                RenderExtensionConfig.addRenderExtension(targetPath);
                RenderExtensionConfig.ReprotManagerFolderPath = targetPath;
                ConfigToolHelper.StartReportServer(true, targetPath);
                winform.showMessage(StaticMessages.updateDone);
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

        private void btnOpenStore_Click(object sender, EventArgs e)
        {
            Process.Start("http://shop.forerunnersw.com");
        }

        private void btnApplyLicense_Click(object sender, EventArgs e)
        {
            if (txtNewKey.Text == "")
            {
                using (new CenterWinDialog(this))
                {
                    MessageBox.Show(this, "LicenseKey Required", "Forerunner Software Mobilizer");
                }
                return;
            }

            //load Licese agreement
            frmEULA frm = new frmEULA();
            DialogResult result = frm.ShowDialog();

            if (result == System.Windows.Forms.DialogResult.Cancel)
                return;

            Cursor.Current = Cursors.WaitCursor;   
            try
            {
                rtbCurLicense.Text = ClientLicense.Activate(txtNewKey.Text);
                ValidateLicense();
            }
            catch (Exception ex)
            {
                Cursor.Current = Cursors.Default;
                using (new CenterWinDialog(this))
                {
                    MessageBox.Show(ex.Message, "Forerunner Software Mobilizer");
                }
            }
            Cursor.Current = Cursors.Default;
            
        }

        private void btnManualActivation_Click(object sender, EventArgs e)
        {
            //frmManualActivation frm = new frmManualActivation();
            //DialogResult result = frm.ShowDialog();
        }

        private void btnProductInfo_Click(object sender, EventArgs e)
        {
            frmProductInfo frm = new frmProductInfo();
            DialogResult result = frm.ShowDialog();
        }

        private void label3_Click(object sender, EventArgs e)
        {

        }

        private void label4_Click(object sender, EventArgs e)
        {

        }

        private void btnDeActivate_Click(object sender, EventArgs e)
        {
            Cursor.Current = Cursors.WaitCursor;
            try
            {
                ClientLicense.DeActivate();
                rtbCurLicense.Text = "";
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

        private void btnCopy_Click(object sender, EventArgs e)
        {
            if (ClientLicense.LicenseString !=null)
                Clipboard.SetText(ClientLicense.LicenseString);
        }

        private void btnValidate_Click(object sender, EventArgs e)
        {
            ValidateLicense();
        }

        private void ValidateLicense()
        {
            Cursor.Current = Cursors.WaitCursor;
            try
            {
                ClientLicense.Validate();
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

        private void btnMerge_Click(object sender, EventArgs e)
        {
            DialogResult dr;

            if (txtNewKey.Text == "")
            {
                using (new CenterWinDialog(this))
                {
                    MessageBox.Show(this, "LicenseKey Required", "Forerunner Software Mobilizer");
                }
                return;
            }
            Cursor.Current = Cursors.WaitCursor;
            try
            {
                using (new CenterWinDialog(this))
                {
                    dr = MessageBox.Show("Are you sure you wish to merge this License, this process is irreversible?", "Forerunner Software Mobilizer", MessageBoxButtons.YesNo);
                }
                if (dr == DialogResult.Yes)
                {
                    rtbCurLicense.Text = ClientLicense.Merge(txtNewKey.Text);
                    ValidateLicense();
                }
            }
            catch (Exception ex)
            {
                Cursor.Current = Cursors.Default;
                using (new CenterWinDialog(this))
                {
                    MessageBox.Show(ex.Message, "Forerunner Software Mobilizer");
                }
            }
            Cursor.Current = Cursors.Default;
           
        }

        private void chkSharepoint_CheckedChanged(object sender, EventArgs e)
        {
              lblSharepoint.Enabled = chkSharepoint.Checked;
              txtSharePointHostName.Enabled = chkSharepoint.Checked;
            
        }

        private void lblWSUrl_Click(object sender, EventArgs e)
        {

        }

        private void label5_Click(object sender, EventArgs e)
        {

        }

        private void tabPage2_Click(object sender, EventArgs e)
        {

        }

        private void btnSplit_Click(object sender, EventArgs e)
        {
            //DialogResult dr;
            int cores=0;
            string input;
            if (ClientLicense.License == null)
            {
                using (new CenterWinDialog(this))
                {
                    MessageBox.Show(this, "LicenseKey Required", "Forerunner Software Mobilizer");
                }
                return;
            }
            Cursor.Current = Cursors.WaitCursor;
            try
            {
                using (new CenterWinDialog(this))
                {
                    using (new CenterWinDialog(this))
                    {
                        input = Microsoft.VisualBasic.Interaction.InputBox("Please enter the number of cores to keep on this machine", "Forerunner Software Mobilizer", ClientLicense.ThisMachine.numberOfCores.ToString());
                    }

                    int.TryParse(input,out cores);
                    //dr = InputBox.Show("Are you sure you wish to split this License, this process is irreversible?", "Forerunner Software Mobilizer", MessageBoxButtons.YesNo,MessageBoxIcon.Question,MessageBoxOptions.DefaultDesktopOnly,);
                }
                if (cores != 0)
                {
                    string newLic = ClientLicense.Split(cores);
                    txtNewKey.Text = newLic;
                    MessageBox.Show("Your new Licenses key is " + newLic + ", we will now activate it on this machine.", "Forerunner Software Mobilizer", MessageBoxButtons.OK);
                    rtbCurLicense.Text = ClientLicense.Activate(newLic);
                    ValidateLicense();
                }
            }
            catch (Exception ex)
            {
                Cursor.Current = Cursors.Default;
                using (new CenterWinDialog(this))
                {
                    MessageBox.Show(ex.Message, "Forerunner Software Mobilizer");
                }
            }
            Cursor.Current = Cursors.Default;
        }
    }
}
