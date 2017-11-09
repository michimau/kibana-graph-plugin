import { TemplateVisTypeProvider } from 'ui/template_vis_type/template_vis_type';
import { VisTypesRegistryProvider } from 'ui/registry/vis_types';
import { VisSchemasProvider } from 'ui/vis/schemas';

import "plugins/graph/graph.less";
import 'plugins/graph/graph_controller';
import graphVisTemplate from 'plugins/graph/graph.html';
import graphVisParamsTemplate from 'plugins/graph/graph_params.html';
//import graphVisParamsTemplate from 'plugins/graph/series.html';


VisTypesRegistryProvider.register(ForceGraphProvider);

function ForceGraphProvider(Private) {
    const TemplateVisType = Private(TemplateVisTypeProvider);
    const Schemas = Private(VisSchemasProvider);

    return new TemplateVisType({
        name: 'graph',
        title: 'Force graph',
        description: 'D3 force layout in Kibana souce',
        icon: 'fa-share-alt',
        template: graphVisTemplate,
        params: {
             defaults: {
                label: 'Fontsize',
                fontSize: 10,
                alphaTarget: 0.3,
                distanceMax: 400,
                strength: -200,
                radius: 6,
                metrics: [{ "id": "", "title": "", "field": "", "type": "" }],
                aggs: [{ "id": "", "title": "", "field": "", "schema": "", "type": "" }]
            },
            editor: graphVisParamsTemplate
        },
        schemas: new Schemas([
            {
                group: 'metrics',
                name: 'metric',
                title: 'Metric',
                min: 1,
                max: 4,
                defaults: [{
                    type: 'count',
                    schema: 'metric'
                }]
            },
            {
                group: 'buckets',
                name: 'bucket',
                title: 'Field',
                aggFilter: '!geohash_grid',
                min: 1,
                max: 5
            }
        ]),
        requiresSearch: true
    });
}

// export the provider so that the visType can be required with Private()
export default ForceGraphProvider;