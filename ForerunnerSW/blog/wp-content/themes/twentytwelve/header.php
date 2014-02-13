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
<link href="/content/site.css" rel="stylesheet"/>';
<link rel="profile" href="http://gmpg.org/xfn/11" />
<link rel="pingback" href="<?php bloginfo( 'pingback_url' ); ?>" />
<?php // Loads HTML5 JavaScript file to add support for HTML5 elements in older IE versions. ?>
<!--[if lt IE 9]>
<script src="<?php echo get_template_directory_uri(); ?>/js/html5.js" type="text/javascript"></script>
<![endif]-->
<?php wp_head(); ?>
</head>

<body <?php body_class(); ?>>

<!-- Forerunner Header -->

   <!-- Header ================================================== -->
    <div id="fb-root"></div>
<script>(function (d, s, id) {
    var js, fjs = d.getElementsByTagName(s)[0];
    if (d.getElementById(id)) return;
    js = d.createElement(s); js.id = id;
    js.src = "//connect.facebook.net/en_US/all.js#xfbml=1";
    fjs.parentNode.insertBefore(js, fjs);
}(document, "script", "facebook-jssdk"));</script>

    <div class="ForerunnerPort Header" style="">
        <div class="ForerunnerPage Center" style="">
            <table class="" style="width: 100%;">
                <tbody>
                    <tr>
                        <td class="ForerunnerTD ForerunnerTD50" style="">
                            <div class="ForerunnerTDLeft ForerunnerLogo">
                                <img class="ForerunnerLogo" src="/Content/img/forerunnersw_logo.png" alt="Forerunner Mobilizer Product" />
                            </div>
                        </td>
                        <td class="ForerunnerTD ForerunnerTD50" style="">
                            <div class="Navbar TopNavbar">
                                <ul>
                                    <li id="Blog" class="Navitem TopNavitem"><a href="../blog">Blog</a></li>
                                    <li id="Contact" class="Navitem TopNavitem"><a href="../home/contact">Contact</a></li>
                                    <li id="About" class="Navitem TopNavitem"><a href="../home/about">About</a></li>
                                    <li id="Support" class="Navitem TopNavitem"><a href="../home/support">Support</a></li>
                                    <li id="Demo" class="Navitem TopNavitem"><a href="../home/demo">Demo</a></li>
                                    <li id="Developers" class="Navitem TopNavitem"><a href="../home/developers">Developers</a></li>
                                    <li id="Store" class="Navitem TopNavitem"><a href="http://shop.forerunnersw.com">Store</a></li>
                                    <li id="Index" class="Navitem TopNavitem"><a href="../Home">Home</a></li>
                                </ul>
								<div>
                                    <br />
                                    <br />
                                    <!-- Place this tag where you want the +1 button to render. -->
                                    <div class="g-plusone" data-size="medium" data-annotation="none"></div>

                                    <!-- Place this tag after the last +1 button tag. -->
                                    <script type="text/javascript">
                                        (function () {
                                            var po = document.createElement('script'); po.type = 'text/javascript'; po.async = true;
                                            po.src = 'https://apis.google.com/js/platform.js';
                                            var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(po, s);
                                        })();
                                    </script>
                                    <script src="//platform.linkedin.com/in.js" type="text/javascript">
                                     lang: en_US
                                    </script>
                                    <script type="IN/Share"></script>
                                    <a href="https://twitter.com/share" class="twitter-share-button" data-url="https://forerunnersw.com" data-via="ForerunnerSW" data-count="none">Tweet</a>
                                    <script>!function (d, s, id) { var js, fjs = d.getElementsByTagName(s)[0], p = /^http:/.test(d.location) ? 'http' : 'https'; if (!d.getElementById(id)) { js = d.createElement(s); js.id = id; js.src = p + '://platform.twitter.com/widgets.js'; fjs.parentNode.insertBefore(js, fjs); } }(document, 'script', 'twitter-wjs');</script>
                                   <a href="http://www.reddit.com/submit" onclick="window.location = 'http://www.reddit.com/submit?url=' + encodeURIComponent(window.location); return false"> <img src="http://www.reddit.com/static/spreddit7.gif" alt="submit to reddit" border="0" /> </a>
                                    <div class="fb-like" data-href="https://forerunnersw.com" data-layout="button_count" data-action="like" data-show-faces="false" data-share="true"></div>
                                </div>
                            </div>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
    <div style="clear: both"></div>

    <!-- Header ================================================== -->';



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