<?php
/**
 * The Header template for our theme
 *
 * Displays all of the <head> section and everything up till <div id="main">
 *
 * @package WordPress
 * @subpackage Twenty_Twelve
 * @since Twenty Twelve 1.0
 */
?><!DOCTYPE html>
<!--[if IE 7]>
<html class="ie ie7" <?php language_attributes(); ?>>
<![endif]-->
<!--[if IE 8]>
<html class="ie ie8" <?php language_attributes(); ?>>
<![endif]-->
<!--[if !(IE 7) | !(IE 8)  ]><!-->
<html <?php language_attributes(); ?>>
<!--<![endif]-->
<head>
<meta charset="<?php bloginfo( 'charset' ); ?>" />
<meta name="viewport" content="width=device-width" />
<title><?php wp_title( '|', true, 'right' ); ?></title>
<link href="/content/site.css" rel="stylesheet"/>
<link rel="profile" href="http://gmpg.org/xfn/11" />
<link rel="pingback" href="<?php bloginfo( 'pingback_url' ); ?>" />
<?php // Loads HTML5 JavaScript file to add support for HTML5 elements in older IE versions. ?>
<!--[if lt IE 9]>
<script src="<?php echo get_template_directory_uri(); ?>/js/html5.js" type="text/javascript"></script>
<![endif]-->
<?php wp_head(); ?>
</head>

<body <?php body_class(); ?>


     <!-- Header ================================================== -->
    <div class="ForerunnerPort Header" style="">
        <div class="ForerunnerPage Center" style="">

            <div class="" style="display:block; width: 100%;">
                <div class="HeaderFont" style="display:block;width: 100%;text-align:right;color:#0b86c6;"><span style="font-size:30px;">855.367.3511</span> | <a style="font-size:14px;" href="/contact">CONTACT US</a> </div>

                <div class="" style="display: table; width: 100%;">
                    <div class="ForerunnerTD " style="max-width:350px;">
                        <div class="ForerunnerTD ForerunnerLogo">
                            <img class="ForerunnerLogo" src="/Content/img/forerunnersw_logo.png" alt="Forerunner Software" />
                        </div>
                    </div>
                    <div class="ForerunnerTD " style="width:100%;">
                        <div class="Navbar TopNavbar">
                            <div style="float:right;">
                                <ul>            
                                    <li id="Index" class="Navitem TopNavitem"><a href="/">HOME</a></li>
                                    <li id="Features" class="Navitem TopNavitem"><a href="/features">FEATURES</a></li>
                                    <li id="Developers" class="Navitem TopNavitem"><a href="/developers">DEVELOPERS</a></li>
                                    <li id="Pricing" class="Navitem TopNavitem"><a href="/pricing">PRICING</a></li>
                                    <li id="Demo" class="Navitem TopNavitem"><a href="/demo">DEMO</a></li>
                                    <li id="Support" class="Navitem TopNavitem"><a href="/support">SUPPORT</a></li>
									<li id="BLOG" class="Navitem TopNavitem"><a  rel="canonical" href="/blog">BLOG</a></li>
                                    <li id="About" class="Navitem TopNavitem"><a href="/about">ABOUT</a></li>
                                    <li id="Register" class="DownloadButton Navitem TopNavitem Rounded"><a href="/registerTrial">FREE TRIAL</a></li>                                                            
                                </ul>
                            </div>                            
                        </div>
                    </div>
                </div>                                    
            </div>
        
      
        </div>        
    </div>
    <div style="clear: both"></div>

    <!-- Header ================================================== -->'



<div id="page" class="hfeed site">
	<header id="masthead" class="site-header" role="banner">
		<hgroup>
			<h1 class="site-title"><a href="<?php echo esc_url( home_url( '/' ) ); ?>" title="<?php echo esc_attr( get_bloginfo( 'name', 'display' ) ); ?>" rel="home"><?php bloginfo( 'name' ); ?></a></h1>
			<h2 class="site-description"><?php bloginfo( 'description' ); ?></h2>
		</hgroup>

		<nav id="site-navigation" class="main-navigation" role="navigation">
			<h3 class="menu-toggle"><?php _e( 'Menu', 'twentytwelve' ); ?></h3>
			<a class="assistive-text" href="#content" title="<?php esc_attr_e( 'Skip to content', 'twentytwelve' ); ?>"><?php _e( 'Skip to content', 'twentytwelve' ); ?></a>
			<?php wp_nav_menu( array( 'theme_location' => 'primary', 'menu_class' => 'nav-menu' ) ); ?>
		</nav><!-- #site-navigation -->

		<?php if ( get_header_image() ) : ?>
		<a href="<?php echo esc_url( home_url( '/' ) ); ?>"><img src="<?php header_image(); ?>" class="header-image" width="<?php echo get_custom_header()->width; ?>" height="<?php echo get_custom_header()->height; ?>" alt="" /></a>
		<?php endif; ?>
	</header><!-- #masthead -->

	<div id="main" class="wrapper">