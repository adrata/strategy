"use client";

import React from "react";

// HYDRATION FIX: Prevents browser extensions from causing hydration errors
// Based on research: https://github.com/vercel/next.js/discussions/72035
export function HydrationFix(): React.JSX.Element {
  return (
    <script
      id="hydration-fix"
      dangerouslySetInnerHTML={{
        __html: `
          // Remove browser extension attributes that cause hydration errors
          (function() {
            try {
              // Fix ColorZilla extension
              if (document.body.hasAttribute('cz-shortcut-listen')) {
                document.body.removeAttribute('cz-shortcut-listen');
              }
              
              // Fix Grammarly extension  
              if (document.body.hasAttribute('data-gr-c-s-loaded')) {
                document.body.removeAttribute('data-gr-c-s-loaded');
              }
              
              // Fix Screen recorder extensions
              var screenRecorderElements = document.querySelectorAll('[id*="scrnli_recorder"]');
              screenRecorderElements.forEach(function(el) {
                if (el.parentNode) {
                  el.parentNode.removeChild(el);
                }
              });
              
              // Monitor for new extension attributes and remove them
              var observer = new MutationObserver(function(mutations) {
                mutations.forEach(function(mutation) {
                  if (mutation['type'] === 'attributes') {
                    var target = mutation.target;
                    var attrName = mutation.attributeName;
                    
                    // Remove known problematic extension attributes
                    if (attrName === 'cz-shortcut-listen' || 
                        attrName === 'data-gr-c-s-loaded' ||
                        attrName && attrName.includes('scrnli')) {
                      target.removeAttribute(attrName);
                    }
                  }
                  
                  // Remove injected extension elements
                  if (mutation['type'] === 'childList') {
                    mutation.addedNodes.forEach(function(node) {
                      if (node['nodeType'] === 1 && (
                          node['id'] && node.id.includes('scrnli_recorder') ||
                          node['className'] && node.className.includes('grammarly')
                        )) {
                        if (node.parentNode) {
                          node.parentNode.removeChild(node);
                        }
                      }
                    });
                  }
                });
              });
              
              // Start observing
              observer.observe(document.body, {
                attributes: true,
                childList: true,
                attributeFilter: ['cz-shortcut-listen', 'data-gr-c-s-loaded']
              });
              
              // Also observe document for head injections
              if (document.head) {
                observer.observe(document.head, {
                  attributes: true,
                  childList: true
                });
              }
              
            } catch (e) {
              console.warn('HydrationFix: Error removing extension attributes:', e);
            }
          })();
        `,
      }}
    />
  );
}
