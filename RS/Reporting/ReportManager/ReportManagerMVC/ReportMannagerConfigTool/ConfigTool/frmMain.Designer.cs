namespace ReportMannagerConfigTool
{
    partial class frmMain
    {
        /// <summary>
        /// Required designer variable.
        /// </summary>
        private System.ComponentModel.IContainer components = null;

        /// <summary>
        /// Clean up any resources being used.
        /// </summary>
        /// <param name="disposing">true if managed resources should be disposed; otherwise, false.</param>
        protected override void Dispose(bool disposing)
        {
            if (disposing && (components != null))
            {
                components.Dispose();
            }
            base.Dispose(disposing);
        }

        #region Windows Form Designer generated code

        /// <summary>
        /// Required method for Designer support - do not modify
        /// the contents of this method with the code editor.
        /// </summary>
        private void InitializeComponent()
        {
            System.ComponentModel.ComponentResourceManager resources = new System.ComponentModel.ComponentResourceManager(typeof(frmMain));
            this.folderSSRS = new System.Windows.Forms.FolderBrowserDialog();
            this.tabMain = new System.Windows.Forms.TabControl();
            this.tabPage2 = new System.Windows.Forms.TabPage();
            this.gbSSRS = new System.Windows.Forms.GroupBox();
            this.lblWSUrl = new System.Windows.Forms.Label();
            this.txtWSUrl = new System.Windows.Forms.TextBox();
            this.lblDBName = new System.Windows.Forms.Label();
            this.txtDBName = new System.Windows.Forms.TextBox();
            this.lblServer = new System.Windows.Forms.Label();
            this.txtServerName = new System.Windows.Forms.TextBox();
            this.gbDBLoginInfo = new System.Windows.Forms.GroupBox();
            this.lblDomain = new System.Windows.Forms.Label();
            this.txtDomain = new System.Windows.Forms.TextBox();
            this.label1 = new System.Windows.Forms.Label();
            this.txtPWD = new System.Windows.Forms.TextBox();
            this.label2 = new System.Windows.Forms.Label();
            this.txtUser = new System.Windows.Forms.TextBox();
            this.rdoSQL = new System.Windows.Forms.RadioButton();
            this.rdoDomain = new System.Windows.Forms.RadioButton();
            this.btnTest = new System.Windows.Forms.Button();
            this.btnApply = new System.Windows.Forms.Button();
            this.tabPage3 = new System.Windows.Forms.TabPage();
            this.textBox1 = new System.Windows.Forms.TextBox();
            this.btnRemoveEx = new System.Windows.Forms.Button();
            this.btnAddEx = new System.Windows.Forms.Button();
            this.btnFolderBrowser = new System.Windows.Forms.Button();
            this.lblReportServer = new System.Windows.Forms.Label();
            this.txtReportServer = new System.Windows.Forms.TextBox();
            this.tabPage1 = new System.Windows.Forms.TabPage();
            this.gbAuthType = new System.Windows.Forms.GroupBox();
            this.rdoFormAuth = new System.Windows.Forms.RadioButton();
            this.rdoWinAuth = new System.Windows.Forms.RadioButton();
            this.btnInstallUWS = new System.Windows.Forms.Button();
            this.btnTestWeb = new System.Windows.Forms.Button();
            this.btnApplyWebServer = new System.Windows.Forms.Button();
            this.lblPort = new System.Windows.Forms.Label();
            this.txtPort = new System.Windows.Forms.TextBox();
            this.lblSiteName = new System.Windows.Forms.Label();
            this.txtSiteName = new System.Windows.Forms.TextBox();
            this.rdoUWS = new System.Windows.Forms.RadioButton();
            this.rdoIIS = new System.Windows.Forms.RadioButton();
            this.tabActivation = new System.Windows.Forms.TabPage();
            this.btnMerge = new System.Windows.Forms.Button();
            this.btnValidate = new System.Windows.Forms.Button();
            this.btnCopy = new System.Windows.Forms.Button();
            this.btnDeActivate = new System.Windows.Forms.Button();
            this.rtbCurLicense = new System.Windows.Forms.RichTextBox();
            this.label4 = new System.Windows.Forms.Label();
            this.btnManualActivation = new System.Windows.Forms.Button();
            this.label3 = new System.Windows.Forms.Label();
            this.txtNewKey = new System.Windows.Forms.TextBox();
            this.btnGetActivationKey = new System.Windows.Forms.Button();
            this.btnActivate = new System.Windows.Forms.Button();
            this.chkSharepoint = new System.Windows.Forms.CheckBox();
            this.txtSharePointHostName = new System.Windows.Forms.TextBox();
            this.lblSharepoint = new System.Windows.Forms.Label();
            this.txtDefaultUserDomain = new System.Windows.Forms.TextBox();
            this.lblDefaultUserDomain = new System.Windows.Forms.Label();
            this.label5 = new System.Windows.Forms.Label();
            this.tabMain.SuspendLayout();
            this.tabPage2.SuspendLayout();
            this.gbSSRS.SuspendLayout();
            this.gbDBLoginInfo.SuspendLayout();
            this.tabPage3.SuspendLayout();
            this.tabPage1.SuspendLayout();
            this.gbAuthType.SuspendLayout();
            this.tabActivation.SuspendLayout();
            this.SuspendLayout();
            // 
            // tabMain
            // 
            this.tabMain.Controls.Add(this.tabPage2);
            this.tabMain.Controls.Add(this.tabPage3);
            this.tabMain.Controls.Add(this.tabPage1);
            this.tabMain.Controls.Add(this.tabActivation);
            resources.ApplyResources(this.tabMain, "tabMain");
            this.tabMain.Name = "tabMain";
            this.tabMain.SelectedIndex = 0;
            // 
            // tabPage2
            // 
            this.tabPage2.Controls.Add(this.gbSSRS);
            this.tabPage2.Controls.Add(this.gbDBLoginInfo);
            this.tabPage2.Controls.Add(this.btnTest);
            this.tabPage2.Controls.Add(this.btnApply);
            resources.ApplyResources(this.tabPage2, "tabPage2");
            this.tabPage2.Name = "tabPage2";
            this.tabPage2.UseVisualStyleBackColor = true;
            this.tabPage2.Click += new System.EventHandler(this.tabPage2_Click);
            // 
            // gbSSRS
            // 
            this.gbSSRS.Controls.Add(this.label5);
            this.gbSSRS.Controls.Add(this.txtDefaultUserDomain);
            this.gbSSRS.Controls.Add(this.lblDefaultUserDomain);
            this.gbSSRS.Controls.Add(this.chkSharepoint);
            this.gbSSRS.Controls.Add(this.txtSharePointHostName);
            this.gbSSRS.Controls.Add(this.lblSharepoint);
            this.gbSSRS.Controls.Add(this.lblWSUrl);
            this.gbSSRS.Controls.Add(this.txtWSUrl);
            resources.ApplyResources(this.gbSSRS, "gbSSRS");
            this.gbSSRS.Name = "gbSSRS";
            this.gbSSRS.TabStop = false;
            // 
            // lblWSUrl
            // 
            resources.ApplyResources(this.lblWSUrl, "lblWSUrl");
            this.lblWSUrl.Name = "lblWSUrl";
            this.lblWSUrl.Click += new System.EventHandler(this.lblWSUrl_Click);
            // 
            // txtWSUrl
            // 
            resources.ApplyResources(this.txtWSUrl, "txtWSUrl");
            this.txtWSUrl.Name = "txtWSUrl";
            this.txtWSUrl.Tag = "Report Server Web Service Url";
            // 
            // lblDBName
            // 
            resources.ApplyResources(this.lblDBName, "lblDBName");
            this.lblDBName.Name = "lblDBName";
            // 
            // txtDBName
            // 
            resources.ApplyResources(this.txtDBName, "txtDBName");
            this.txtDBName.Name = "txtDBName";
            this.txtDBName.Tag = "Database Name";
            // 
            // lblServer
            // 
            resources.ApplyResources(this.lblServer, "lblServer");
            this.lblServer.Name = "lblServer";
            // 
            // txtServerName
            // 
            resources.ApplyResources(this.txtServerName, "txtServerName");
            this.txtServerName.Name = "txtServerName";
            this.txtServerName.Tag = "Server Name";
            // 
            // gbDBLoginInfo
            // 
            this.gbDBLoginInfo.Controls.Add(this.lblDomain);
            this.gbDBLoginInfo.Controls.Add(this.txtDomain);
            this.gbDBLoginInfo.Controls.Add(this.label1);
            this.gbDBLoginInfo.Controls.Add(this.txtPWD);
            this.gbDBLoginInfo.Controls.Add(this.label2);
            this.gbDBLoginInfo.Controls.Add(this.txtUser);
            this.gbDBLoginInfo.Controls.Add(this.rdoSQL);
            this.gbDBLoginInfo.Controls.Add(this.lblDBName);
            this.gbDBLoginInfo.Controls.Add(this.rdoDomain);
            this.gbDBLoginInfo.Controls.Add(this.txtDBName);
            this.gbDBLoginInfo.Controls.Add(this.lblServer);
            this.gbDBLoginInfo.Controls.Add(this.txtServerName);
            resources.ApplyResources(this.gbDBLoginInfo, "gbDBLoginInfo");
            this.gbDBLoginInfo.Name = "gbDBLoginInfo";
            this.gbDBLoginInfo.TabStop = false;
            // 
            // lblDomain
            // 
            resources.ApplyResources(this.lblDomain, "lblDomain");
            this.lblDomain.Name = "lblDomain";
            // 
            // txtDomain
            // 
            resources.ApplyResources(this.txtDomain, "txtDomain");
            this.txtDomain.Name = "txtDomain";
            this.txtDomain.Tag = "Domain";
            // 
            // label1
            // 
            resources.ApplyResources(this.label1, "label1");
            this.label1.Name = "label1";
            // 
            // txtPWD
            // 
            resources.ApplyResources(this.txtPWD, "txtPWD");
            this.txtPWD.Name = "txtPWD";
            this.txtPWD.Tag = "Password";
            // 
            // label2
            // 
            resources.ApplyResources(this.label2, "label2");
            this.label2.Name = "label2";
            // 
            // txtUser
            // 
            resources.ApplyResources(this.txtUser, "txtUser");
            this.txtUser.Name = "txtUser";
            this.txtUser.Tag = "User Name";
            // 
            // rdoSQL
            // 
            resources.ApplyResources(this.rdoSQL, "rdoSQL");
            this.rdoSQL.Name = "rdoSQL";
            this.rdoSQL.TabStop = true;
            this.rdoSQL.Tag = "SQLAccount";
            this.rdoSQL.UseVisualStyleBackColor = true;
            this.rdoSQL.CheckedChanged += new System.EventHandler(this.rdoSQL_CheckedChanged);
            // 
            // rdoDomain
            // 
            resources.ApplyResources(this.rdoDomain, "rdoDomain");
            this.rdoDomain.Checked = true;
            this.rdoDomain.Name = "rdoDomain";
            this.rdoDomain.TabStop = true;
            this.rdoDomain.Tag = "DomainAccount";
            this.rdoDomain.UseVisualStyleBackColor = true;
            // 
            // btnTest
            // 
            resources.ApplyResources(this.btnTest, "btnTest");
            this.btnTest.Name = "btnTest";
            this.btnTest.UseVisualStyleBackColor = true;
            this.btnTest.Click += new System.EventHandler(this.btnTest_Click);
            // 
            // btnApply
            // 
            resources.ApplyResources(this.btnApply, "btnApply");
            this.btnApply.Name = "btnApply";
            this.btnApply.UseVisualStyleBackColor = true;
            this.btnApply.Click += new System.EventHandler(this.btnApply_Click);
            // 
            // tabPage3
            // 
            this.tabPage3.Controls.Add(this.textBox1);
            this.tabPage3.Controls.Add(this.btnRemoveEx);
            this.tabPage3.Controls.Add(this.btnAddEx);
            this.tabPage3.Controls.Add(this.btnFolderBrowser);
            this.tabPage3.Controls.Add(this.lblReportServer);
            this.tabPage3.Controls.Add(this.txtReportServer);
            resources.ApplyResources(this.tabPage3, "tabPage3");
            this.tabPage3.Name = "tabPage3";
            this.tabPage3.UseVisualStyleBackColor = true;
            // 
            // textBox1
            // 
            this.textBox1.BackColor = System.Drawing.SystemColors.Window;
            this.textBox1.BorderStyle = System.Windows.Forms.BorderStyle.None;
            resources.ApplyResources(this.textBox1, "textBox1");
            this.textBox1.Name = "textBox1";
            this.textBox1.ReadOnly = true;
            // 
            // btnRemoveEx
            // 
            resources.ApplyResources(this.btnRemoveEx, "btnRemoveEx");
            this.btnRemoveEx.Name = "btnRemoveEx";
            this.btnRemoveEx.UseVisualStyleBackColor = true;
            this.btnRemoveEx.Click += new System.EventHandler(this.btnRemoveEx_Click);
            // 
            // btnAddEx
            // 
            resources.ApplyResources(this.btnAddEx, "btnAddEx");
            this.btnAddEx.Name = "btnAddEx";
            this.btnAddEx.UseVisualStyleBackColor = true;
            this.btnAddEx.Click += new System.EventHandler(this.btnAddEx_Click);
            // 
            // btnFolderBrowser
            // 
            resources.ApplyResources(this.btnFolderBrowser, "btnFolderBrowser");
            this.btnFolderBrowser.Name = "btnFolderBrowser";
            this.btnFolderBrowser.UseVisualStyleBackColor = true;
            this.btnFolderBrowser.Click += new System.EventHandler(this.btnFolderBrowser_Click);
            // 
            // lblReportServer
            // 
            resources.ApplyResources(this.lblReportServer, "lblReportServer");
            this.lblReportServer.Name = "lblReportServer";
            // 
            // txtReportServer
            // 
            resources.ApplyResources(this.txtReportServer, "txtReportServer");
            this.txtReportServer.Name = "txtReportServer";
            this.txtReportServer.Tag = "Report Server Folder";
            // 
            // tabPage1
            // 
            this.tabPage1.Controls.Add(this.gbAuthType);
            this.tabPage1.Controls.Add(this.btnInstallUWS);
            this.tabPage1.Controls.Add(this.btnTestWeb);
            this.tabPage1.Controls.Add(this.btnApplyWebServer);
            this.tabPage1.Controls.Add(this.lblPort);
            this.tabPage1.Controls.Add(this.txtPort);
            this.tabPage1.Controls.Add(this.lblSiteName);
            this.tabPage1.Controls.Add(this.txtSiteName);
            this.tabPage1.Controls.Add(this.rdoUWS);
            this.tabPage1.Controls.Add(this.rdoIIS);
            resources.ApplyResources(this.tabPage1, "tabPage1");
            this.tabPage1.Name = "tabPage1";
            this.tabPage1.UseVisualStyleBackColor = true;
            // 
            // gbAuthType
            // 
            this.gbAuthType.Controls.Add(this.rdoFormAuth);
            this.gbAuthType.Controls.Add(this.rdoWinAuth);
            resources.ApplyResources(this.gbAuthType, "gbAuthType");
            this.gbAuthType.Name = "gbAuthType";
            this.gbAuthType.TabStop = false;
            // 
            // rdoFormAuth
            // 
            resources.ApplyResources(this.rdoFormAuth, "rdoFormAuth");
            this.rdoFormAuth.Name = "rdoFormAuth";
            this.rdoFormAuth.Tag = "Forms";
            this.rdoFormAuth.UseVisualStyleBackColor = true;
            // 
            // rdoWinAuth
            // 
            resources.ApplyResources(this.rdoWinAuth, "rdoWinAuth");
            this.rdoWinAuth.Checked = true;
            this.rdoWinAuth.Name = "rdoWinAuth";
            this.rdoWinAuth.TabStop = true;
            this.rdoWinAuth.Tag = "Windows";
            this.rdoWinAuth.UseVisualStyleBackColor = true;
            // 
            // btnInstallUWS
            // 
            resources.ApplyResources(this.btnInstallUWS, "btnInstallUWS");
            this.btnInstallUWS.Name = "btnInstallUWS";
            this.btnInstallUWS.UseVisualStyleBackColor = true;
            this.btnInstallUWS.Click += new System.EventHandler(this.btnInstallUWS_Click);
            // 
            // btnTestWeb
            // 
            resources.ApplyResources(this.btnTestWeb, "btnTestWeb");
            this.btnTestWeb.Name = "btnTestWeb";
            this.btnTestWeb.UseVisualStyleBackColor = true;
            this.btnTestWeb.Click += new System.EventHandler(this.btnTestWeb_Click);
            // 
            // btnApplyWebServer
            // 
            resources.ApplyResources(this.btnApplyWebServer, "btnApplyWebServer");
            this.btnApplyWebServer.Name = "btnApplyWebServer";
            this.btnApplyWebServer.UseVisualStyleBackColor = true;
            this.btnApplyWebServer.Click += new System.EventHandler(this.btnApplyWebServer_Click);
            // 
            // lblPort
            // 
            resources.ApplyResources(this.lblPort, "lblPort");
            this.lblPort.Name = "lblPort";
            // 
            // txtPort
            // 
            resources.ApplyResources(this.txtPort, "txtPort");
            this.txtPort.Name = "txtPort";
            // 
            // lblSiteName
            // 
            resources.ApplyResources(this.lblSiteName, "lblSiteName");
            this.lblSiteName.Name = "lblSiteName";
            // 
            // txtSiteName
            // 
            resources.ApplyResources(this.txtSiteName, "txtSiteName");
            this.txtSiteName.Name = "txtSiteName";
            // 
            // rdoUWS
            // 
            resources.ApplyResources(this.rdoUWS, "rdoUWS");
            this.rdoUWS.Name = "rdoUWS";
            this.rdoUWS.UseVisualStyleBackColor = true;
            // 
            // rdoIIS
            // 
            resources.ApplyResources(this.rdoIIS, "rdoIIS");
            this.rdoIIS.Checked = true;
            this.rdoIIS.Name = "rdoIIS";
            this.rdoIIS.TabStop = true;
            this.rdoIIS.UseVisualStyleBackColor = true;
            // 
            // tabActivation
            // 
            this.tabActivation.Controls.Add(this.btnMerge);
            this.tabActivation.Controls.Add(this.btnValidate);
            this.tabActivation.Controls.Add(this.btnCopy);
            this.tabActivation.Controls.Add(this.btnDeActivate);
            this.tabActivation.Controls.Add(this.rtbCurLicense);
            this.tabActivation.Controls.Add(this.label4);
            this.tabActivation.Controls.Add(this.btnManualActivation);
            this.tabActivation.Controls.Add(this.label3);
            this.tabActivation.Controls.Add(this.txtNewKey);
            this.tabActivation.Controls.Add(this.btnGetActivationKey);
            this.tabActivation.Controls.Add(this.btnActivate);
            resources.ApplyResources(this.tabActivation, "tabActivation");
            this.tabActivation.Name = "tabActivation";
            this.tabActivation.UseVisualStyleBackColor = true;
            // 
            // btnMerge
            // 
            resources.ApplyResources(this.btnMerge, "btnMerge");
            this.btnMerge.Name = "btnMerge";
            this.btnMerge.UseVisualStyleBackColor = true;
            this.btnMerge.Click += new System.EventHandler(this.btnMerge_Click);
            // 
            // btnValidate
            // 
            resources.ApplyResources(this.btnValidate, "btnValidate");
            this.btnValidate.Name = "btnValidate";
            this.btnValidate.UseVisualStyleBackColor = true;
            this.btnValidate.Click += new System.EventHandler(this.btnValidate_Click);
            // 
            // btnCopy
            // 
            resources.ApplyResources(this.btnCopy, "btnCopy");
            this.btnCopy.Name = "btnCopy";
            this.btnCopy.UseVisualStyleBackColor = true;
            this.btnCopy.Click += new System.EventHandler(this.btnCopy_Click);
            // 
            // btnDeActivate
            // 
            resources.ApplyResources(this.btnDeActivate, "btnDeActivate");
            this.btnDeActivate.Name = "btnDeActivate";
            this.btnDeActivate.UseVisualStyleBackColor = true;
            this.btnDeActivate.Click += new System.EventHandler(this.btnDeActivate_Click);
            // 
            // rtbCurLicense
            // 
            resources.ApplyResources(this.rtbCurLicense, "rtbCurLicense");
            this.rtbCurLicense.Name = "rtbCurLicense";
            this.rtbCurLicense.ReadOnly = true;
            // 
            // label4
            // 
            resources.ApplyResources(this.label4, "label4");
            this.label4.Name = "label4";
            // 
            // btnManualActivation
            // 
            resources.ApplyResources(this.btnManualActivation, "btnManualActivation");
            this.btnManualActivation.Name = "btnManualActivation";
            this.btnManualActivation.UseVisualStyleBackColor = true;
            this.btnManualActivation.Click += new System.EventHandler(this.btnManualActivation_Click);
            // 
            // label3
            // 
            resources.ApplyResources(this.label3, "label3");
            this.label3.Name = "label3";
            this.label3.Click += new System.EventHandler(this.label3_Click);
            // 
            // txtNewKey
            // 
            resources.ApplyResources(this.txtNewKey, "txtNewKey");
            this.txtNewKey.Name = "txtNewKey";
            // 
            // btnGetActivationKey
            // 
            resources.ApplyResources(this.btnGetActivationKey, "btnGetActivationKey");
            this.btnGetActivationKey.Name = "btnGetActivationKey";
            this.btnGetActivationKey.UseVisualStyleBackColor = true;
            this.btnGetActivationKey.Click += new System.EventHandler(this.btnOpenStore_Click);
            // 
            // btnActivate
            // 
            resources.ApplyResources(this.btnActivate, "btnActivate");
            this.btnActivate.Name = "btnActivate";
            this.btnActivate.UseVisualStyleBackColor = true;
            this.btnActivate.Click += new System.EventHandler(this.btnApplyLicense_Click);
            // 
            // chkSharepoint
            // 
            resources.ApplyResources(this.chkSharepoint, "chkSharepoint");
            this.chkSharepoint.Name = "chkSharepoint";
            this.chkSharepoint.UseVisualStyleBackColor = true;
            this.chkSharepoint.CheckedChanged += new System.EventHandler(this.chkSharepoint_CheckedChanged);
            // 
            // txtSharePointHostName
            // 
            resources.ApplyResources(this.txtSharePointHostName, "txtSharePointHostName");
            this.txtSharePointHostName.Name = "txtSharePointHostName";
            // 
            // lblSharepoint
            // 
            resources.ApplyResources(this.lblSharepoint, "lblSharepoint");
            this.lblSharepoint.Name = "lblSharepoint";
            // 
            // txtDefaultUserDomain
            // 
            resources.ApplyResources(this.txtDefaultUserDomain, "txtDefaultUserDomain");
            this.txtDefaultUserDomain.Name = "txtDefaultUserDomain";
            this.txtDefaultUserDomain.Tag = "Default User Domain";
            // 
            // lblDefaultUserDomain
            // 
            resources.ApplyResources(this.lblDefaultUserDomain, "lblDefaultUserDomain");
            this.lblDefaultUserDomain.Name = "lblDefaultUserDomain";
            // 
            // label5
            // 
            resources.ApplyResources(this.label5, "label5");
            this.label5.Name = "label5";
            this.label5.Click += new System.EventHandler(this.label5_Click);
            // 
            // frmMain
            // 
            resources.ApplyResources(this, "$this");
            this.AutoScaleMode = System.Windows.Forms.AutoScaleMode.Font;
            this.Controls.Add(this.tabMain);
            this.FormBorderStyle = System.Windows.Forms.FormBorderStyle.FixedDialog;
            this.MaximizeBox = false;
            this.Name = "frmMain";
            this.tabMain.ResumeLayout(false);
            this.tabPage2.ResumeLayout(false);
            this.gbSSRS.ResumeLayout(false);
            this.gbSSRS.PerformLayout();
            this.gbDBLoginInfo.ResumeLayout(false);
            this.gbDBLoginInfo.PerformLayout();
            this.tabPage3.ResumeLayout(false);
            this.tabPage3.PerformLayout();
            this.tabPage1.ResumeLayout(false);
            this.tabPage1.PerformLayout();
            this.gbAuthType.ResumeLayout(false);
            this.gbAuthType.PerformLayout();
            this.tabActivation.ResumeLayout(false);
            this.tabActivation.PerformLayout();
            this.ResumeLayout(false);

        }

        #endregion

        private System.Windows.Forms.FolderBrowserDialog folderSSRS;
        private System.Windows.Forms.TabControl tabMain;
        private System.Windows.Forms.TabPage tabPage3;
        private System.Windows.Forms.Button btnRemoveEx;
        private System.Windows.Forms.Button btnAddEx;
        private System.Windows.Forms.Button btnFolderBrowser;
        private System.Windows.Forms.Label lblReportServer;
        private System.Windows.Forms.TextBox txtReportServer;
        private System.Windows.Forms.TextBox textBox1;
        private System.Windows.Forms.TabPage tabPage1;
        private System.Windows.Forms.Button btnTestWeb;
        private System.Windows.Forms.Button btnApplyWebServer;
        private System.Windows.Forms.Label lblPort;
        private System.Windows.Forms.TextBox txtPort;
        private System.Windows.Forms.Label lblSiteName;
        private System.Windows.Forms.TextBox txtSiteName;
        private System.Windows.Forms.RadioButton rdoUWS;
        private System.Windows.Forms.RadioButton rdoIIS;
        private System.Windows.Forms.Button btnInstallUWS;
        private System.Windows.Forms.GroupBox gbAuthType;
        private System.Windows.Forms.RadioButton rdoFormAuth;
        private System.Windows.Forms.RadioButton rdoWinAuth;
        private System.Windows.Forms.TabPage tabActivation;
        private System.Windows.Forms.Button btnActivate;
        private System.Windows.Forms.Button btnGetActivationKey;
        private System.Windows.Forms.Button btnManualActivation;
        private System.Windows.Forms.Label label3;
        private System.Windows.Forms.TextBox txtNewKey;
        private System.Windows.Forms.Label label4;
        private System.Windows.Forms.RichTextBox rtbCurLicense;
        private System.Windows.Forms.Button btnCopy;
        private System.Windows.Forms.Button btnDeActivate;
        private System.Windows.Forms.Button btnValidate;
        private System.Windows.Forms.Button btnMerge;
        private System.Windows.Forms.TabPage tabPage2;
        private System.Windows.Forms.GroupBox gbSSRS;
        private System.Windows.Forms.Label lblWSUrl;
        private System.Windows.Forms.TextBox txtWSUrl;
        private System.Windows.Forms.Label lblDBName;
        private System.Windows.Forms.TextBox txtDBName;
        private System.Windows.Forms.Label lblServer;
        private System.Windows.Forms.TextBox txtServerName;
        private System.Windows.Forms.GroupBox gbDBLoginInfo;
        private System.Windows.Forms.Label lblDomain;
        private System.Windows.Forms.TextBox txtDomain;
        private System.Windows.Forms.Label label1;
        private System.Windows.Forms.TextBox txtPWD;
        private System.Windows.Forms.Label label2;
        private System.Windows.Forms.TextBox txtUser;
        private System.Windows.Forms.RadioButton rdoSQL;
        private System.Windows.Forms.RadioButton rdoDomain;
        private System.Windows.Forms.Button btnTest;
        private System.Windows.Forms.Button btnApply;
        private System.Windows.Forms.CheckBox chkSharepoint;
        private System.Windows.Forms.TextBox txtSharePointHostName;
        private System.Windows.Forms.Label lblSharepoint;
        private System.Windows.Forms.TextBox txtDefaultUserDomain;
        private System.Windows.Forms.Label lblDefaultUserDomain;
        private System.Windows.Forms.Label label5;
    }
}

