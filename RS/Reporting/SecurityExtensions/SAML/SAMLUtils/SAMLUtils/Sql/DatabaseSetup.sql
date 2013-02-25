IF EXISTS(SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME='AuthorityCollection') DROP TABLE AuthorityCollection
GO
IF EXISTS(SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME='UserCollection') DROP TABLE UserCollection
GO
IF EXISTS(SELECT * FROM sys.objects 
   WHERE object_id = OBJECT_ID(N'[dbo].[sp_LoadCertificate]') AND type in (N'P', N'PC')) DROP PROCEDURE sp_LoadCertificate
GO
IF EXISTS(SELECT * FROM sys.objects 
   WHERE object_id = OBJECT_ID(N'[dbo].[sp_GetCertificate]') AND type in (N'P', N'PC')) DROP PROCEDURE sp_GetCertificate
GO
IF EXISTS(SELECT * FROM sys.objects 
   WHERE object_id = OBJECT_ID(N'[dbo].[sp_SetIDPUrl]') AND type in (N'P', N'PC')) DROP PROCEDURE sp_SetIDPUrl
GO
IF EXISTS(SELECT * FROM sys.objects 
   WHERE object_id = OBJECT_ID(N'[dbo].[sp_GetIDPUrl]') AND type in (N'P', N'PC')) DROP PROCEDURE sp_GetIDPUrl
GO
IF EXISTS(SELECT * FROM sys.objects 
   WHERE object_id = OBJECT_ID(N'[dbo].[sp_AddReportingUser]') AND type in (N'P', N'PC')) DROP PROCEDURE sp_AddReportingUser
GO
IF EXISTS(SELECT * FROM sys.objects 
   WHERE object_id = OBJECT_ID(N'[dbo].[sp_CheckUserExists]') AND type in (N'P', N'PC')) DROP PROCEDURE sp_CheckUserExists
GO

/*2083 is the current IE Url limit*/
CREATE TABLE AuthorityCollection(ID int identity(1,1), Authority nvarchar(256), CertificateBlob nvarchar(1024), IDPUrl nvarchar(2083), Constraint UC_Authority Unique (Authority))
GO
CREATE TABLE  UserCollection(ID int identity(1,1), Authority nvarchar(256), UserName nvarchar(512))
GO

CREATE PROCEDURE sp_LoadCertificate
@Authority nvarchar(256),
@CertificateBlob nvarchar(1024)
AS
IF NOT EXISTS(SELECT * FROM AuthorityCollection Where Authority = @Authority) INSERT AuthorityCollection (Authority) VALUES (@Authority) 
UPDATE AuthorityCollection
SET CertificateBlob = @CertificateBlob
WHERE Authority = @Authority
GO


CREATE PROCEDURE sp_GetCertificate
@Authority nvarchar(256)
AS
SELECT CertificateBlob From AuthorityCollection Where Authority = @Authority
Go

CREATE PROCEDURE sp_SetIDPUrl
@Authority nvarchar(256),
@IDPUrl nvarchar(2083)
AS
IF NOT EXISTS(SELECT * FROM AuthorityCollection Where Authority = @Authority) INSERT AuthorityCollection (Authority) VALUES (@Authority) 
UPDATE AuthorityCollection
SET IDPUrl = @IDPUrl
WHERE Authority = @Authority
Go

CREATE PROCEDURE sp_GetIDPUrl
@Authority nvarchar(256)
AS
SELECT IDPUrl From AuthorityCollection Where Authority = @Authority
Go

CREATE PROCEDURE sp_AddReportingUser
@Authority nvarchar(256),
@NameID nvarchar(256)
AS
IF NOT EXISTS(SELECT * FROM UserCollection Where Authority=@Authority AND UserName=@Authority+N'.'+@NameID)
BEGIN
	INSERT INTO UserCollection (Authority, UserName) VALUES (@Authority, @Authority+N'.'+@NameID)
END
GO

CREATE PROCEDURE sp_CheckUserExists
@UserName nvarchar(512)
AS
SELECT UserName From UserCollection Where UserName=@UserName
GO

