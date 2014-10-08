//>>excludeStart("jqmBuildExclude", pragmas.jqmBuildExclude);
//>>description: Responsive presentation and behavior for HTML data panels
//>>label: Panel
//>>group: Widgets
//>>css.structure: ../css/structure/jquery.mobile.panel.css
//>>css.theme: ../css/themes/default/jquery.mobile.theme.css

define( [ "jquery", "../widget", "./page" ], function( jQuery ) {
//>>excludeEnd("jqmBuildExclude");
(function( $, undefined ) {

// This declaration records the default value of the panel's class names. It is only used during
// the deprecation period (1.5.0) to map the old class keys to the new class keys and doubles as
// the hash of deprecated class keys.
var oldClassKeys = {
	panel: "ui-panel",
	panelOpen: "ui-panel-open",
	panelClosed: "ui-panel-closed",
	panelFixed: "ui-panel-fixed",
	panelInner: "ui-panel-inner",
	modal: "ui-panel-dismiss",
	modalOpen: "ui-panel-dismiss-open",
	pageContainer: "ui-panel-page-container",
	pageWrapper: "ui-panel-wrapper",
	pageFixedToolbar: "ui-panel-fixed-toolbar",
	animate: "ui-panel-animate"
};

$.widget( "mobile.panel", {
	options: {

		// Merging old and new class keys is deprecated. As of 1.6.0 we will drop the old class
		// keys and thus this will be a simple declaration once more.
		classes: $.extend( {}, {
			"ui-panel": null,
			"ui-panel-position-left": null,
			"ui-panel-position-right": null,
			"ui-panel-display-reveal": null,
			"ui-panel-display-push": null,
			"ui-panel-display-overlay": null,
			"ui-panel-open": null,
			"ui-panel-closed": null,
			"ui-panel-fixed": null,
			"ui-panel-inner": null,
			"ui-panel-dismiss": null,
			"ui-panel-dismiss-position-left": null,
			"ui-panel-dismiss-position-right": null,
			"ui-panel-dismiss-display-reveal": null,
			"ui-panel-dismiss-display-push": null,
			"ui-panel-dismiss-display-overlay": null,
			"ui-panel-dismiss-open": null,
			"ui-panel-page-container": null,
			"ui-panel-page-container-themed": null,
			"ui-panel-wrapper": null,
			"ui-panel-fixed-toolbar": null,
			"ui-panel-page-content-open": null,
			"ui-panel-page-content-position-left": null,
			"ui-panel-page-content-position-right": null,
			"ui-panel-page-content-display-reveal": null,
			"ui-panel-page-content-display-push": null,
			"ui-panel-page-content-display-overlay": null,
			"ui-panel-animate": null
		}, oldClassKeys ),
		animate: true,
		theme: null,
		position: "left",
		dismissible: true,
		display: "reveal", //accepts reveal, push, overlay
		swipeClose: true,
		positionFixed: false
	},

	_closeLink: null,
	_parentPage: null,
	_page: null,
	_modal: null,
	_panelInner: null,
	_wrapper: null,
	_fixedToolbars: null,

	_create: function() {
		var el = this.element,
			parentPage = el.closest( ".ui-page, :jqmData(role='page')" );

		// Copy the value of the old class key to the new class key, but remove the new class key
		// from the value of the old class key first. This step is deprecated as of 1.5.0 and will
		// be removed in 1.6.0, because we will drop the old class keys entirely.
		this._copyClassKeys( oldClassKeys, this.options.classes );

		// expose some private props to other methods
		$.extend( this, {
			_closeLink: el.find( ":jqmData(rel='close')" ),
			_parentPage: ( parentPage.length > 0 ) ? parentPage : false,
			_openedPage: null,
			_page: this._getPage,
			_panelInner: this._getPanelInner(),
			_fixedToolbars: this._getFixedToolbars
		});
		if ( this.options.display !== "overlay" ){
			this._getWrapper();
		}
		this._addPanelClasses();

		// if animating, add the class to do so
		if ( $.support.cssTransform3d && !!this.options.animate ) {
			this.element.addClass( this._classes( "ui-panel-animate" ) );
		}

		this._bindUpdateLayout();
		this._bindCloseEvents();
		this._bindLinkListeners();
		this._bindPageEvents();

		if ( !!this.options.dismissible ) {
			this._createModal();
		}

		this._bindSwipeEvents();
	},

	// This function is deprecated as of 1.5.0 and will be removed in 1.6.0. It serves to bridge
	// the gap between the old class keys and the new class keys for the classes option.
	_copyClassKeys: function( oldClassKeys, classes ) {
		var oldKey, newKey, oldValue, newValue, finalValue, keyInValueIndex;

		for ( oldKey in oldClassKeys ) {
			newKey = oldClassKeys[ oldKey ];
			oldValue = ( classes[ oldKey ] ? classes[ oldKey ].split( " " ) : [] );
			newValue = ( classes[ newKey ] ? classes[ newKey ].split( " " ) : [] );
			finalValue = oldValue.concat( newValue );
			keyInValueIndex = finalValue.indexOf( newKey );
			if ( keyInValueIndex >= 0 ) {
				finalValue.splice( keyInValueIndex, 1 );
			}
			classes[ newKey ] = finalValue.join( " " ) || null;
		}
	},

	_getPanelInner: function() {
		var panelInner = this.element.find( ".ui-panel-inner" );

		if ( panelInner.length === 0 ) {
			panelInner = this.element
				.children()
					.wrapAll( "<div class='" + this._classes( "ui-panel-inner" ) + "' />" )
						.parent();
		}

		return panelInner;
	},

	_createModal: function() {
		var self = this,
			target = self._parentPage ? self._parentPage.parent() : self.element.parent();

		self._modal = $( "<div class='" + this._classes( "ui-panel-dismiss" ) + "'></div>" )
			.on( "mousedown", function() {
				self.close();
			})
			.appendTo( target );
	},

	_getPage: function() {
		var page = this._openedPage || this._parentPage || $( "." + $.mobile.activePageClass );

		return page;
	},

	_getWrapper: function() {
		var wrapper = this._page().find( ".ui-panel-wrapper" );
		if ( wrapper.length === 0 ) {
			wrapper = this._page().children( ".ui-header:not(.ui-header-fixed), .ui-content:not(.ui-popup), .ui-footer:not(.ui-footer-fixed)" )
				.wrapAll( "<div class='" + this._classes( "ui-panel-wrapper" ) + "'></div>" )
				.parent();
		}

		this._wrapper = wrapper;
	},

	_getFixedToolbars: function() {
		var extFixedToolbars = $( "body" ).children( ".ui-header-fixed, .ui-footer-fixed" ),
			intFixedToolbars = this._page().find( ".ui-header-fixed, .ui-footer-fixed" ),
			fixedToolbars = extFixedToolbars
				.add( intFixedToolbars )
					.addClass( this._classes( "ui-panel-fixed-toolbar" ) );

		return fixedToolbars;
	},

	_getPosDisplayClasses: function( prefix ) {
		return this._classes( prefix + "-position-" + this.options.position + " " +
			prefix + "-display-" + this.options.display );
	},

	_getPanelClasses: function() {
		var panelClasses = this._classes( "ui-panel" ) +
			" " + this._getPosDisplayClasses( "ui-panel" ) +
			" " + this._classes( "ui-panel-closed" ) +
			" " + "ui-body-" + ( this.options.theme ? this.options.theme : "inherit" );

		if ( !!this.options.positionFixed ) {
			panelClasses += " " + this._classes( "ui-panel-fixed" );
		}

		return panelClasses;
	},

	_addPanelClasses: function() {
		this.element.addClass( this._getPanelClasses() );
	},

	_handleCloseClick: function( event ) {
		if ( !event.isDefaultPrevented() ) {
			this.close();
		}
	},

	_bindCloseEvents: function() {
		this._on( this._closeLink, {
			"click": "_handleCloseClick"
		});

		this._on({
			"click a:jqmData(ajax='false')": "_handleCloseClick"
		});
	},

	_positionPanel: function( scrollToTop ) {
		var self = this,
			panelInnerHeight = self._panelInner.outerHeight(),
			expand = panelInnerHeight > $.mobile.getScreenHeight();

		if ( expand || !self.options.positionFixed ) {
			if ( expand ) {
				self._unfixPanel();
				$.mobile.resetActivePageHeight( panelInnerHeight );
			}
			if ( scrollToTop ) {
				this.window[ 0 ].scrollTo( 0, $.mobile.defaultHomeScroll );
			}
		} else {
			self._fixPanel();
		}
	},

	_bindFixListener: function() {
		this._on( $( window ), { "throttledresize": "_positionPanel" });
	},

	_unbindFixListener: function() {
		this._off( $( window ), "throttledresize" );
	},

	_unfixPanel: function() {
		if ( !!this.options.positionFixed && $.support.fixedPosition ) {
			this.element.removeClass( this._classes( "ui-panel-fixed" ) );
		}
	},

	_fixPanel: function() {
		if ( !!this.options.positionFixed && $.support.fixedPosition ) {
			this.element.addClass( this._classes( "ui-panel-fixed" ) );
		}
	},

	_bindUpdateLayout: function() {
		var self = this;

		self.element.on( "updatelayout", function(/* e */) {
			if ( self._open ) {
				self._positionPanel();
			}
		});
	},

	_bindLinkListeners: function() {
		this._on( "body", {
			"click a": "_handleClick"
		});

	},

	_handleClick: function( e ) {
		var link,
			panelId = this.element.attr( "id" );

		if ( e.currentTarget.href.split( "#" )[ 1 ] === panelId && panelId !== undefined ) {

			e.preventDefault();
			link = $( e.target );
			if ( link.hasClass( "ui-btn" ) ) {
				link.addClass( $.mobile.activeBtnClass );
				this.element.one( "panelopen panelclose", function() {
					link.removeClass( $.mobile.activeBtnClass );
				});
			}
			this.toggle();
		}
	},

	_bindSwipeEvents: function() {
		var self = this,
			area = self._modal ? self.element.add( self._modal ) : self.element;

		// on swipe, close the panel
		if ( !!self.options.swipeClose ) {
			if ( self.options.position === "left" ) {
				area.on( "swipeleft.panel", function(/* e */) {
					self.close();
				});
			} else {
				area.on( "swiperight.panel", function(/* e */) {
					self.close();
				});
			}
		}
	},

	_bindPageEvents: function() {
		var self = this;

		this.document
			// Close the panel if another panel on the page opens
			.on( "panelbeforeopen", function( e ) {
				if ( self._open && e.target !== self.element[ 0 ] ) {
					self.close();
				}
			})
			// On escape, close? might need to have a target check too...
			.on( "keyup.panel", function( e ) {
				if ( e.keyCode === 27 && self._open ) {
					self.close();
				}
			});
		if ( !this._parentPage && this.options.display !== "overlay" ) {
			this._on( this.document, {
				"pageshow": "_getWrapper"
			});
		}
		// Clean up open panels after page hide
		if ( self._parentPage ) {
			this.document.on( "pagehide", ":jqmData(role='page')", function() {
				if ( self._open ) {
					self.close( true );
				}
			});
		} else {
			this.document.on( "pagebeforehide", function() {
				if ( self._open ) {
					self.close( true );
				}
			});
		}
	},

	// state storage of open or closed
	_open: false,
	_pageContentOpenClasses: null,
	_modalOpenClasses: null,

	open: function( immediate ) {
		if ( !this._open ) {
			var self = this,
				o = self.options,

				_openPanel = function() {
					self._off( self.document , "panelclose" );
					self._page().jqmData( "panel", "open" );

					if ( $.support.cssTransform3d && !!o.animate && o.display !== "overlay" ) {
						self._wrapper.addClass( self._classes( "ui-panel-animate" ) );
						self._fixedToolbars().addClass( self._classes( "ui-panel-animate" ) );
					}

					if ( !immediate && $.support.cssTransform3d && !!o.animate ) {
						( self._wrapper || self.element )
							.animationComplete( complete, "transition" );
					} else {
						setTimeout( complete, 0 );
					}

					if ( o.theme && o.display !== "overlay" ) {
						self._page().parent()
							.addClass( self._classes( "ui-panel-page-container-themed" ) +
								" ui-panel-page-container-" + o.theme );
					}

					self.element
						.removeClass( self._classes( "ui-panel-closed" ) )
						.addClass( self._classes( "ui-panel-open" ) );

					self._positionPanel( true );

					self._pageContentOpenClasses = self._getPosDisplayClasses(
						"ui-panel-page-content" );

					if ( o.display !== "overlay" ) {
						self._page()
							.parent()
								.addClass( self._classes("ui-panel-page-container" ) );
						self._wrapper.addClass( self._pageContentOpenClasses );
						self._fixedToolbars().addClass( self._pageContentOpenClasses );
					}

					self._modalOpenClasses = self._getPosDisplayClasses( "ui-panel-dismiss" ) +
						" " + self._classes( "ui-panel-dismiss-open" );
					if ( self._modal ) {
						self._modal
							.addClass( self._modalOpenClasses )
							.height( Math.max( self._modal.height(), self.document.height() ) );
					}
				},
				complete = function() {

					// Bail if the panel was closed before the opening animation has completed
					if ( !self._open ) {
						return;
					}

					if ( o.display !== "overlay" ) {
						self._wrapper.addClass( self._classes( "ui-panel-page-content-open" ) );
						self._fixedToolbars()
							.addClass( self._classes( "ui-panel-page-content-open" ) );
					}

					self._bindFixListener();

					self._trigger( "open" );

					self._openedPage = self._page();
				};

			self._trigger( "beforeopen" );

			if ( self._page().jqmData( "panel" ) === "open" ) {
				self._on( self.document, {
					"panelclose": _openPanel
				});
			} else {
				_openPanel();
			}

			self._open = true;
		}
	},

	close: function( immediate ) {
		if ( this._open ) {
			var self = this,
				o = this.options,

				_closePanel = function() {

					self.element.removeClass( self._classes( "ui-panel-open" ) );

					if ( o.display !== "overlay" ) {
						self._wrapper.removeClass( self._pageContentOpenClasses );
						self._fixedToolbars().removeClass( self._pageContentOpenClasses );
					}

					if ( !immediate && $.support.cssTransform3d && !!o.animate ) {
						( self._wrapper || self.element )
							.animationComplete( complete, "transition" );
					} else {
						setTimeout( complete, 0 );
					}

					if ( self._modal ) {
						self._modal
							.removeClass( self._modalOpenClasses )
							.height( "" );
					}
				},
				complete = function() {
					if ( o.theme && o.display !== "overlay" ) {
						self._page()
							.parent()
								.removeClass( self._classes( "ui-panel-page-container-themed" ) +
									" " + "ui-panel-page-container-" + o.theme );
					}

					self.element.addClass( self._classes( "ui-panel-closed" ) );

					if ( o.display !== "overlay" ) {
						self._page()
							.parent()
								.removeClass( self._classes( "ui-panel-page-container" ) );
						self._wrapper.removeClass( self._classes( "ui-panel-page-content-open" ) );
						self._fixedToolbars()
							.removeClass( self._classes( "ui-panel-page-content-open" ) );
					}

					if ( $.support.cssTransform3d && !!o.animate && o.display !== "overlay" ) {
						self._wrapper.removeClass( self._classes( "ui-panel-animate" ) );
						self._fixedToolbars().removeClass( self._classes( "ui-panel-animate" ) );
					}

					self._fixPanel();
					self._unbindFixListener();
					$.mobile.resetActivePageHeight();

					self._page().jqmRemoveData( "panel" );

					self._trigger( "close" );

					self._openedPage = null;
				};

			self._trigger( "beforeclose" );

			_closePanel();

			self._open = false;
		}
	},

	toggle: function() {
		this[ this._open ? "close" : "open" ]();
	},

	_destroy: function() {
		var otherPanels,
		o = this.options,
		multiplePanels = ( $( "body > :mobile-panel" ).length + $.mobile.activePage.find( ":mobile-panel" ).length ) > 1;

		if ( o.display !== "overlay" ) {

			//  remove the wrapper if not in use by another panel
			otherPanels = $( "body > :mobile-panel" ).add( $.mobile.activePage.find( ":mobile-panel" ) );
			if ( otherPanels.not( ".ui-panel-display-overlay" ).not( this.element ).length === 0 ) {
				this._wrapper.children().unwrap();
			}

			if ( this._open ) {

				this._fixedToolbars().removeClass( this._classes( "ui-panel-page-content-open" ) );

				if ( $.support.cssTransform3d && !!o.animate ) {
					this._fixedToolbars().removeClass( this._classes( "ui-panel-animate" ) );
				}

				this._page().parent().removeClass( this._classes( "ui-panel-page-container" ) );

				if ( o.theme ) {
					this._page()
						.parent()
							.removeClass( this._classes( "ui-panel-page-container-themed" ) + " " +
								"ui-panel-page-container-" + o.theme );
				}
			}
		}

		if ( !multiplePanels ) {

			this.document.off( "panelopen panelclose" );

		}

		if ( this._open ) {
			this._page().jqmRemoveData( "panel" );
		}

		this._panelInner.children().unwrap();

		this.element
			.removeClass([
				this._getPanelClasses(),
				this._classes( "ui-panel-open" ),
				this._classes( "ui-panel-animate" ) ].join( " " ) )
			.off( "swipeleft.panel swiperight.panel" )
			.off( "panelbeforeopen" )
			.off( "panelhide" )
			.off( "keyup.panel" )
			.off( "updatelayout" );

		if ( this._modal ) {
			this._modal.remove();
		}
	}
});

})( jQuery );
//>>excludeStart("jqmBuildExclude", pragmas.jqmBuildExclude);
});
//>>excludeEnd("jqmBuildExclude");
