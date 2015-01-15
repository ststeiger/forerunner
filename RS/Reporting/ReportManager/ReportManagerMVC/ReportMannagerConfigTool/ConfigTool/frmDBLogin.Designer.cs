namespace ReportMannagerConfigTool
{
    partial class frmDBLogin
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
            this.gbDBLoginInfo = new System.Windows.Forms.GroupBox();
            this.lblDomain = new System.Windows.Forms.Label();
            this.txtDomain = new System.Windows.Forms.TextBox();
            this.label1 = new System.Windows.Forms.Label();
            this.txtPWD = new System.Windows.Forms.TextBox();
            this.label2 = new System.Windows.Forms.Label();
            this.txtUser = new System.Windows.Forms.TextBox();
            this.rdoSQL = new System.Windows.Forms.RadioButton();
            this.lblDBName = new System.Windows.Forms.Label();
            this.rdoDomain = new System.Windows.Forms.RadioButton();
            this.txtDBName = new System.Windows.Forms.TextBox();
            this.lblServer = new System.Windows.Forms.Label();
            this.txtServerName = new System.Windows.Forms.TextBox();
            this.btnOK = new System.Windows.Forms.Button();
            this.btnCancel = new System.Windows.Forms.Button();
            this.gbDBLoginInfo.SuspendLayout();
            this.SuspendLayout();
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
            this.gbDBLoginInfo.Location = new System.Drawing.Point(3, 2);
            this.gbDBLoginInfo.Name = "gbDBLoginInfo";
            this.gbDBLoginInfo.Size = new System.Drawing.Size(207, 237);
            this.gbDBLoginInfo.TabIndex = 10;
            this.gbDBLoginInfo.TabStop = false;
            this.gbDBLoginInfo.Text = "Database Login, DBO";
            this.gbDBLoginInfo.Enter += new System.EventHandler(this.gbDBLoginInfo_Enter);
            // 
            // lblDomain
            // 
            this.lblDomain.AutoSize = true;
            this.lblDomain.ImeMode = System.Windows.Forms.ImeMode.NoControl;
            this.lblDomain.Location = new System.Drawing.Point(5, 173);
            this.lblDomain.Name = "lblDomain";
            this.lblDomain.Size = new System.Drawing.Size(43, 13);
            this.lblDomain.TabIndex = 18;
            this.lblDomain.Text = "Domain";
            // 
            // txtDomain
            // 
            this.txtDomain.Location = new System.Drawing.Point(6, 187);
            this.txtDomain.Name = "txtDomain";
            this.txtDomain.Size = new System.Drawing.Size(188, 20);
            this.txtDomain.TabIndex = 19;
            this.txtDomain.Tag = "Domain";
            // 
            // label1
            // 
            this.label1.AutoSize = true;
            this.label1.ImeMode = System.Windows.Forms.ImeMode.NoControl;
            this.label1.Location = new System.Drawing.Point(4, 137);
            this.label1.Name = "label1";
            this.label1.Size = new System.Drawing.Size(53, 13);
            this.label1.TabIndex = 16;
            this.label1.Text = "Password";
            // 
            // txtPWD
            // 
            this.txtPWD.Location = new System.Drawing.Point(6, 150);
            this.txtPWD.Name = "txtPWD";
            this.txtPWD.PasswordChar = '*';
            this.txtPWD.Size = new System.Drawing.Size(188, 20);
            this.txtPWD.TabIndex = 17;
            this.txtPWD.Tag = "Password";
            // 
            // label2
            // 
            this.label2.AutoSize = true;
            this.label2.ImeMode = System.Windows.Forms.ImeMode.NoControl;
            this.label2.Location = new System.Drawing.Point(6, 99);
            this.label2.Name = "label2";
            this.label2.Size = new System.Drawing.Size(33, 13);
            this.label2.TabIndex = 14;
            this.label2.Text = "Login";
            // 
            // txtUser
            // 
            this.txtUser.Location = new System.Drawing.Point(6, 113);
            this.txtUser.Name = "txtUser";
            this.txtUser.Size = new System.Drawing.Size(188, 20);
            this.txtUser.TabIndex = 15;
            this.txtUser.Tag = "User Name";
            // 
            // rdoSQL
            // 
            this.rdoSQL.AutoSize = true;
            this.rdoSQL.ImeMode = System.Windows.Forms.ImeMode.NoControl;
            this.rdoSQL.Location = new System.Drawing.Point(116, 214);
            this.rdoSQL.Name = "rdoSQL";
            this.rdoSQL.Size = new System.Drawing.Size(89, 17);
            this.rdoSQL.TabIndex = 21;
            this.rdoSQL.TabStop = true;
            this.rdoSQL.Tag = "SQLAccount";
            this.rdoSQL.Text = "SQL Account";
            this.rdoSQL.UseVisualStyleBackColor = true;
            this.rdoSQL.CheckedChanged += new System.EventHandler(this.rdoSQL_CheckedChanged);
            // 
            // lblDBName
            // 
            this.lblDBName.AutoSize = true;
            this.lblDBName.ImeMode = System.Windows.Forms.ImeMode.NoControl;
            this.lblDBName.Location = new System.Drawing.Point(3, 58);
            this.lblDBName.Name = "lblDBName";
            this.lblDBName.Size = new System.Drawing.Size(84, 13);
            this.lblDBName.TabIndex = 12;
            this.lblDBName.Text = "Database Name";
            // 
            // rdoDomain
            // 
            this.rdoDomain.AutoSize = true;
            this.rdoDomain.Checked = true;
            this.rdoDomain.ImeMode = System.Windows.Forms.ImeMode.NoControl;
            this.rdoDomain.Location = new System.Drawing.Point(6, 214);
            this.rdoDomain.Name = "rdoDomain";
            this.rdoDomain.Size = new System.Drawing.Size(104, 17);
            this.rdoDomain.TabIndex = 20;
            this.rdoDomain.TabStop = true;
            this.rdoDomain.Tag = "DomainAccount";
            this.rdoDomain.Text = "Domain Account";
            this.rdoDomain.UseVisualStyleBackColor = true;
            // 
            // txtDBName
            // 
            this.txtDBName.Location = new System.Drawing.Point(6, 74);
            this.txtDBName.Name = "txtDBName";
            this.txtDBName.Size = new System.Drawing.Size(188, 20);
            this.txtDBName.TabIndex = 13;
            this.txtDBName.Tag = "Database Name";
            this.txtDBName.Text = "ReportServer";
            // 
            // lblServer
            // 
            this.lblServer.ImeMode = System.Windows.Forms.ImeMode.NoControl;
            this.lblServer.Location = new System.Drawing.Point(4, 20);
            this.lblServer.Name = "lblServer";
            this.lblServer.Size = new System.Drawing.Size(134, 13);
            this.lblServer.TabIndex = 10;
            this.lblServer.Text = "Database Server Name";
            // 
            // txtServerName
            // 
            this.txtServerName.Location = new System.Drawing.Point(6, 36);
            this.txtServerName.Name = "txtServerName";
            this.txtServerName.Size = new System.Drawing.Size(188, 20);
            this.txtServerName.TabIndex = 11;
            this.txtServerName.Tag = "Server Name";
            this.txtServerName.Text = ".";
            // 
            // btnOK
            // 
            this.btnOK.Location = new System.Drawing.Point(133, 245);
            this.btnOK.Name = "btnOK";
            this.btnOK.Size = new System.Drawing.Size(75, 23);
            this.btnOK.TabIndex = 11;
            this.btnOK.Text = "OK";
            this.btnOK.UseVisualStyleBackColor = true;
            this.btnOK.Click += new System.EventHandler(this.btnOK_Click);
            // 
            // btnCancel
            // 
            this.btnCancel.DialogResult = System.Windows.Forms.DialogResult.Cancel;
            this.btnCancel.Location = new System.Drawing.Point(52, 245);
            this.btnCancel.Name = "btnCancel";
            this.btnCancel.Size = new System.Drawing.Size(75, 23);
            this.btnCancel.TabIndex = 12;
            this.btnCancel.Text = "Cancel";
            this.btnCancel.UseVisualStyleBackColor = true;
            this.btnCancel.Click += new System.EventHandler(this.btnCancel_Click);
            // 
            // frmDBLogin
            // 
            this.AcceptButton = this.btnOK;
            this.AutoScaleDimensions = new System.Drawing.SizeF(6F, 13F);
            this.AutoScaleMode = System.Windows.Forms.AutoScaleMode.Font;
            this.CancelButton = this.btnCancel;
            this.ClientSize = new System.Drawing.Size(217, 274);
            this.ControlBox = false;
            this.Controls.Add(this.btnCancel);
            this.Controls.Add(this.btnOK);
            this.Controls.Add(this.gbDBLoginInfo);
            this.Name = "frmDBLogin";
            this.StartPosition = System.Windows.Forms.FormStartPosition.CenterParent;
            this.Text = "Database Login";
            this.Load += new System.EventHandler(this.frmDBLogin_Load);
            this.gbDBLoginInfo.ResumeLayout(false);
            this.gbDBLoginInfo.PerformLayout();
            this.ResumeLayout(false);

        }

        #endregion

        private System.Windows.Forms.GroupBox gbDBLoginInfo;
        private System.Windows.Forms.Label lblDomain;
        private System.Windows.Forms.TextBox txtDomain;
        private System.Windows.Forms.Label label1;
        private System.Windows.Forms.TextBox txtPWD;
        private System.Windows.Forms.Label label2;
        private System.Windows.Forms.TextBox txtUser;
        private System.Windows.Forms.RadioButton rdoSQL;
        private System.Windows.Forms.Label lblDBName;
        private System.Windows.Forms.RadioButton rdoDomain;
        private System.Windows.Forms.TextBox txtDBName;
        private System.Windows.Forms.Label lblServer;
        private System.Windows.Forms.TextBox txtServerName;
        private System.Windows.Forms.Button btnOK;
        private System.Windows.Forms.Button btnCancel;
    }
}