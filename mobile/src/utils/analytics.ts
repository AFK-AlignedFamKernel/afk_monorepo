// src/analytics.ts
export const initGoogleAnalytics = (trackingId: string) => {
  if (typeof window !== 'undefined') {
    const script1 = document.createElement('script');
    script1.async = true;
    script1.src = `https://www.googletagmanager.com/gtag/js?id=${trackingId}`;
    document.head.appendChild(script1);

    // Add the gtag initialization script
    const script2 = document.createElement('script');
    script2.innerHTML = `
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${trackingId}');
        `;
    document.head.appendChild(script2);

    //   const script = document.createElement('script');
    //   script.src = `https://www.googletagmanager.com/gtag/js?id=${trackingId}`;
    //   script.async = true;
    //   document.head.appendChild(script);

    //   window?.dataLayer = window.dataLayer || [];
    //   function gtag() {
    //     window.dataLayer.push(arguments);
    //   }
    //   gtag('js', new Date());
    //   gtag('config', trackingId);
  }
};

export const logPageView = () => {
  if (typeof window !== 'undefined') {
    window.gtag('event', 'page_view', {
      page_path: window.location.pathname,
    });
  }
};

export const logClickedEvent = (
  event: string,
  category?: string,
  label?: string,
  value?: number
) => {
  try {
    if (typeof window !== "undefined" && window.gtag) {
      window.gtag("event", event, {
        event_category: category || "Interaction",
        event_label: label || "Button Click",
        value: value || 1,
        page_path: window.location.pathname,
        timestamp: new Date().toISOString(),
        user_agent: navigator.userAgent,
      });
    }
  } catch (error) {
    console.error(error);
  }

};