// A mock model that is used for testing. Extend your custom model from this and use it when testing
// in place of the real model.
export default class MockModel {
  constructor(models, foreignKeyNames={}) {
    // A list of all models that exist.
    this.models = []
    if (models) {
      models.forEach(this.create.bind(this));
    }
    this.foreignKeyNames = foreignKeyNames;
    this.idCounter = 0;

    this.methods = [];
  }

  _handleQueries({where, limit, include, offset}) {
    let models = this.models;

    if (where) {
      models = models.filter(model => {
        for (const key in where) {
          if (where[key] !== model[key]) {
            return false;
          }
        }
        return true;
      });
    }

    if (offset) {
      models = models.slice(offset)
    }

    if (limit) {
      models = models.slice(0, limit)
    }

    if (include) {
      include.forEach(({model, as}) => {
        // Add the foreign key to the query specified with `include`.
        models = models.map(m => {
          const output = model.models.find(i => i.id === m[`${as}Id`]);
          if (output) {
            return {...m, [as]: output};
          } else {
            throw new Error(`No such model ${as} found with the id ${i.id}`);
          }
        });
      });
    }
    return models;
  }

  findOne(query) {
    const model = this._handleQueries({...query, limit: 1});
    return Promise.resolve(model.length ? this.formatModelInstance(model[0]) : null);
  }
  findAll(query) {
    const models = this._handleQueries(query);
    return Promise.all(models.map(this.formatModelInstance.bind(this)));
  }
  update(data, query) {
    // Get models to update
    const models = this._handleQueries(query).map(i => i.id);

    // Perform update
    this.models = this.models.map(model => {
      if (models.indexOf(model.id) >= 0) {
        return Object.assign({}, model, data);
      } else {
        return model;
      }
    });

    // Resolve the number of changed items.
    return Promise.resolve([models.length]);
  }
  destroy(query) {
    // Get models to update
    const models = this._handleQueries(query).map(i => i.id);

    // Remove all matching models from the collection.
    this.models = this.models.filter(model => models.indexOf(model.id) === -1);

    // Resolve the number of changed items.
    return Promise.resolve(models.length);
  }
  findById(id) {
    const model = this._handleQueries({where: {id}, limit: 1});
    return Promise.resolve(model.length ? this.formatModelInstance(model[0]) : null);
  }
  create(data) {
    data.id = (++this.idCounter).toString();

    // Any foriegn keys get a `Id` suffixed version too.
    for (const fkey in this.foreignKeyNames) {
      data[fkey+'Id'] = data[fkey];
    }

    this.models.push(data);
    return Promise.resolve(data);
  }
  all() {
    return Promise.all(this.models.map(this.formatModelInstance.bind(this)));
  }

  // Before returning an instance, run it through this function to populate any of the foriegn key
  // fields.
  formatModelInstance(instance) {
    const all = Object.keys(this.foreignKeyNames).reduce((acc, fkey) => {
      const Model = this.foreignKeyNames[fkey];
      return [...acc, Model.findOne({where: {id: instance[`${fkey}Id`]}}).then(data => {
        instance[fkey] = data;
      })];
    }, []);

    // Add all the methods to this item.
    for (const method in this.methods) {
      instance[method] = this.methods[method].bind(instance);
    }

    return Promise.all(all).then(() => {
      return instance;
    });
  }
}
