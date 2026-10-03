const DASHBOARD_APL_DOCUMENT = {
  type: 'APL',
  version: '1.8',
  theme: 'dark',
  import: [
    {
      name: 'alexa-layouts',
      version: '1.5.0'
    }
  ],
  mainTemplate: {
    parameters: ['payload'],
    items: [
      {
        type: 'Container',
        width: '100vw',
        height: '100vh',
        direction: 'column',
        alignItems: 'center',
        justifyContent: 'spaceContent',
        paddingLeft: '5vw',
        paddingRight: '5vw',
        paddingTop: '3vh',
        paddingBottom: '3vh',
        items: [
          // Header Bar
          {
            type: 'AlexaHeader',
            headerTitle: '${payload.title}',
            headerSubtitle: 'WEEX 5-Engine Trading Ecosystem',
            headerAttributionImage: 'https://via.placeholder.com/50'
          },
          // Core Metric Card
          {
            type: 'Container',
            direction: 'row',
            width: '90vw',
            justifyContent: 'spaceBetween',
            items: [
              {
                type: 'Text',
                text: '<b>Portfolio:</b> $${payload.primaryMetric}',
                style: 'textStyleDetail',
                fontSize: '28dp',
                color: '#00FF66'
              },
              {
                type: 'Text',
                text: '<b>Status:</b> ${payload.statusText}',
                style: 'textStyleDetail',
                fontSize: '28dp',
                color: '${payload.statusColor}'
              }
            ]
          },
          // Dynamic List or Sub-text
          {
            type: 'AlexaTextList',
            width: '90vw',
            height: '40vh',
            listItems: '${payload.items}',
            primaryAction: []
          }
        ]
      }
    ]
  }
};
