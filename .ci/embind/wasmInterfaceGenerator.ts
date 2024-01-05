import * as fs from 'fs';

export interface ExportSpecification {
  type: string;
  filepath: string;
  template?: string;
}

export const generateWasmInterfaces = async (
  definitionFilepath: string,
  interfaceName: string,
  containerName: string,
  exportSpecifications: ExportSpecification[]
) => {
  const definition: any = await readJsonFile(definitionFilepath);
  const interfaceDefinitions: InterfaceDefinition =
    interpretDefinition(definition);
  await exportSpecifications.forEach(
    async (specification: ExportSpecification) => {
      let exportData: string = '';
      const exportType = specification.type.toLocaleLowerCase();
      if (exportType == 'ts') {
        exportData = createTsInterface(containerName, interfaceDefinitions);
      } else if (exportType == 'c++') {
        exportData = createCppInterface(interfaceName, interfaceDefinitions);
      } else if (exportType == 'md') {
        exportData = createMd(interfaceName, interfaceDefinitions);
      }
      if (exportData) {
        let headerText =
          exportType == 'c++' ? '// This file was created automatically\n' : '';
        try {
          const template: string = await readTextFile(specification.template);
          const placeholder: string = '${DATA}';
          if (template && template.includes(placeholder)) {
            exportData = template.replace(placeholder, exportData);
            if (exportType == 'c++')
              headerText += `// from ${specification.template}\n`;
          }
        } catch {}
        if (headerText)
          await writeOutputFile(
            specification.filepath,
            headerText + '\n' + exportData
          );
        else await writeOutputFile(specification.filepath, exportData);
      }
    }
  );
};

const readTextFile = async (jsonFilePath: string) => {
  const textFile: string = await fs.promises.readFile(jsonFilePath, 'utf8');
  return textFile;
};

const readJsonFile = async (jsonFilePath: string) => {
  const jsonFile: string = await fs.promises.readFile(jsonFilePath, 'utf8');
  return JSON.parse(jsonFile);
};

const writeOutputFile = async (outputFilePath: string, data: string) => {
  await fs.writeFile(outputFilePath, data, { flag: 'w+' }, (err) => {
    if (err) {
      return console.error(err);
    }
  });
};

interface ObjectDefinition {
  type: string;
  name: string;
}

interface ParameterDefinition {
  name: string;
  tsType: string;
  cppType?: string;
}

interface VectorDefinition extends ObjectDefinition {
  tsType?: string;
  cppType: string;
}

interface MapDefinition extends ObjectDefinition {
  tsType?: string;
  tsKeyType: string;
  tsValueType: string;
  cppKeyType: string;
  cppValueType: string;
}

interface TemplateDefinition extends ObjectDefinition {
  tsInterface: string;
  cppFactory: string;
  tsType?: string;
  cppType: string;
}

interface FunctionDefinition extends ObjectDefinition {
  cppInterface: string;
  cppType?: string;
  parameters: ParameterDefinition[];
}

interface ValueDefinition {
  value: string;
  cppValue: string;
}

interface EnumDefinition extends ObjectDefinition {
  cppType: string;
  values: ValueDefinition[];
}

interface FieldDefinition {
  type: string;
  name: string;
  tsType?: string;
  optional?: true;
  cppType?: string;
  cppClassType?: string;
  cppAttribute?: string;
  perValue?: boolean;
  cppGetter?: string;
  cppSetter?: string;
}

interface ValueObjectDefinition extends ObjectDefinition {
  cppType: string;
  fields: FieldDefinition[];
}

interface MethodDefinition extends ObjectDefinition {
  cppInterface: string;
  tsType?: string;
  cppType?: string;
  parameters: ParameterDefinition[];
  description?: string;
  preprocessorDefinition?: string;
}

interface PropertyDefinition {
  type: string;
  name: string;
  tsType: string;
  cppType: string;
  perValue?: boolean;
  cppGetter: string;
  cppSetter?: string;
  preprocessorDefinition?: string;
}

interface ClassDefinition extends ObjectDefinition {
  cppType: string;
  cppBaseClass: string;
  methods: MethodDefinition[];
}

interface ValueObject {
  name: string;
  object: ValueDefinition;
}

interface EnumObject {
  name: string;
  object: EnumDefinition;
  values: ValueObject[];
}

interface VectorObject {
  name: string;
  object: VectorDefinition;
}

interface MapObject {
  name: string;
  object: MapDefinition;
}

interface TemplateObject {
  name: string;
  tsInterface: string;
  cppFactory: string;
  object: VectorDefinition;
}

interface FieldObject {
  name: string;
  object: FieldDefinition;
}

interface ValueObjectObject {
  name: string;
  object: ValueObjectDefinition;
  fields: FieldObject[];
}

interface MethodObject {
  name: string;
  object: MethodDefinition;
}

interface PropertyObject {
  name: string;
  object: PropertyDefinition;
}

interface ClassObject {
  name: string;
  object: ClassDefinition;
  constructors: MethodObject[];
  classFunctions: MethodObject[];
  functions: MethodObject[];
  properties: PropertyObject[];
}

interface FunctionObject {
  name: string;
  object: FunctionDefinition;
}

interface InterfaceDefinition {
  enums: EnumObject[];
  valueObjects: ValueObjectObject[];
  vectors: VectorObject[];
  maps: MapObject[];
  templates: TemplateObject[];
  functions: FunctionObject[];
  classes: ClassObject[];
}

const interpretDefinition = (definition: any): InterfaceDefinition => {
  let enums: EnumObject[] = [];
  let valueObjects: ValueObjectObject[] = [];
  let vectors: VectorObject[] = [];
  let maps: MapObject[] = [];
  let templates: TemplateObject[] = [];
  let classes: ClassObject[] = [];
  let functions: FunctionObject[] = [];
  definition.objects?.forEach((element: ObjectDefinition) => {
    const lowerType: string = element.type.toLowerCase();
    if (lowerType == 'enum') {
      const enumElement = element as EnumDefinition;
      let enumValues: ValueObject[] = [];
      enumElement.values.forEach((enumValue: ValueDefinition) => {
        enumValues.push({ name: enumValue.value, object: enumValue });
      });
      //enumValues.sort((a: ValueObject, b: ValueObject) => { return (a.name < b.name) ? -1 : ((a.name > b.name) ? 1 : 0) })
      enums.push({
        name: element.name,
        object: enumElement,
        values: enumValues,
      });
    } else if (lowerType == 'value_object') {
      const valueObjectElement = element as ValueObjectDefinition;
      let fields: FieldObject[] = [];
      valueObjectElement.fields.forEach((filed: FieldDefinition) => {
        fields.push({ name: filed.name, object: filed });
      });
      fields.sort((a: FieldObject, b: FieldObject) => {
        return a.name < b.name ? -1 : a.name > b.name ? 1 : 0;
      });
      valueObjects.push({
        name: element.name,
        object: valueObjectElement,
        fields: fields,
      });
    } else if (lowerType == 'vector') {
      const vectorElement = element as VectorDefinition;
      vectors.push({
        name: vectorElement.name,
        object: vectorElement,
      });
    } else if (lowerType == 'map') {
      const mapElement = element as MapDefinition;
      maps.push({
        name: mapElement.name,
        object: mapElement,
      });
    } else if (lowerType == 'template') {
      const templateElement = element as TemplateDefinition;
      templates.push({
        name: templateElement.name,
        tsInterface: templateElement.tsInterface,
        cppFactory: templateElement.cppFactory,
        object: templateElement,
      });
    } else if (lowerType == 'class') {
      const classElement = element as ClassDefinition;
      let classFunctions: MethodObject[] = [];
      let constructors: MethodObject[] = [];
      let functions: MethodObject[] = [];
      let properties: PropertyObject[] = [];
      classElement.methods.forEach(
        (item: MethodDefinition | PropertyDefinition) => {
          const lowerMethodType: string = item.type.toLocaleLowerCase();
          if (lowerMethodType == 'class_function') {
            classFunctions.push({
              name: item.name,
              object: item as MethodDefinition,
            });
          } else if (
            lowerMethodType == 'function' ||
            lowerMethodType == 'method' ||
            lowerMethodType == 'method_const'
          ) {
            functions.push({
              name: item.name,
              object: item as MethodDefinition,
            });
          } else if (lowerMethodType == 'smart_ptr_constructor') {
            constructors.push({
              name: item.name,
              object: item as MethodDefinition,
            });
          } else if (
            lowerMethodType == 'property' ||
            lowerMethodType == 'class_property'
          ) {
            properties.push({
              name: item.name,
              object: item as PropertyDefinition,
            });
          }
        }
      );
      //classFunctions.sort((a: MethodObject, b: MethodObject) => { return (a.name < b.name) ? -1 : ((a.name > b.name) ? 1 : 0) })
      //constructors.sort((a: MethodObject, b: MethodObject) => { return (a.name < b.name) ? -1 : ((a.name > b.name) ? 1 : 0) })
      //functions.sort((a: MethodObject, b: MethodObject) => { return (a.name < b.name) ? -1 : ((a.name > b.name) ? 1 : 0) })
      classes.push({
        name: element.name,
        object: classElement,
        constructors: constructors,
        classFunctions: classFunctions,
        functions: functions,
        properties: properties,
      });
    } else if (lowerType == 'function') {
      functions.push({
        name: element.name,
        object: element as FunctionDefinition,
      });
    }
  });
  enums.sort((a: EnumObject, b: EnumObject) => {
    return a.name < b.name ? -1 : a.name > b.name ? 1 : 0;
  });
  valueObjects.sort((a: ValueObjectObject, b: ValueObjectObject) => {
    return a.name < b.name ? -1 : a.name > b.name ? 1 : 0;
  });
  //classes.sort((a: ClassObject, b: ClassObject) => { return (a.name < b.name) ? -1 : ((a.name > b.name) ? 1 : 0) })
  //functions.sort((a: FunctionObject, b: FunctionObject) => { return (a.name < b.name) ? -1 : ((a.name > b.name) ? 1 : 0) })

  return {
    enums: enums,
    valueObjects: valueObjects,
    vectors: vectors,
    maps: maps,
    templates: templates,
    classes: classes,
    functions: functions,
  };
};

const cppFunctionSignature = (functionObject: FunctionObject): string => {
  let templateSignature: string = '';
  if (
    functionObject.object.parameters?.every((parameter) => parameter.cppType) ??
    functionObject.object.cppType
  ) {
    templateSignature += functionObject.object.cppType ?? 'void';
    functionObject.object.parameters?.forEach(
      (parameter) => (templateSignature += `, ${parameter.cppType}`)
    );
  }
  const signature: string = `emscripten::function${
    templateSignature ? `<${templateSignature}>` : ''
  }("${functionObject.object.name}", &${functionObject.object.cppInterface})`;
  return signature;
};

const cppSmartPointerConstructorSignature = (
  methodObject: MethodObject
): string => {
  let templateSignature: string = '';
  if (
    methodObject.object.parameters?.every((parameter) => parameter.cppType) ??
    methodObject.object.cppType
  ) {
    templateSignature += methodObject.object.cppType ?? 'void';
    methodObject.object.parameters?.forEach(
      (parameter) => (templateSignature += `, ${parameter.cppType}`)
    );
  }
  const name = methodObject.object.cppInterface
    ? `smart_ptr_constructor`
    : 'smart_ptr';
  const methodArgument = methodObject.object.cppInterface
    ? `, &${methodObject.object.cppInterface}`
    : '';
  const signature: string = `.${name}${
    templateSignature ? `<${templateSignature}>` : ''
  }("${methodObject.object.name}"${methodArgument})`;
  return signature;
};

const cppClassFunctionSignature = (methodObject: MethodObject): string => {
  let templateSignature: string = '';
  if (
    methodObject.object.parameters?.every((parameter) => parameter.cppType) ??
    methodObject.object.cppType
  ) {
    templateSignature += methodObject.object.cppType ?? 'void';
    methodObject.object.parameters?.forEach(
      (parameter) => (templateSignature += `, ${parameter.cppType}`)
    );
  }
  const signature: string = `.class_function${
    templateSignature ? `<${templateSignature}>` : ''
  }("${methodObject.object.name}", &${methodObject.object.cppInterface})`;
  return signature;
};

const cppMethodSignature = (
  classObject: ClassDefinition,
  methodObject: MethodObject
): string => {
  let templateSignature: string = '';
  if (
    methodObject.object.parameters?.every((parameter) => parameter.cppType) ??
    methodObject.object.cppType
  ) {
    templateSignature += methodObject.object.cppType ?? 'void';
    templateSignature +=
      methodObject.object.type == 'function'
        ? `(${classObject.cppType}&`
        : `(${classObject.cppType}::*)(`;
    for (let i = 0; i < methodObject.object.parameters?.length; ++i) {
      if (i > 0 || methodObject.object.type == 'function')
        templateSignature += ', ';
      templateSignature += `${methodObject.object.parameters[i].cppType}`;
    }
    templateSignature += `)`;
    if (methodObject.object.type == 'method_const')
      templateSignature += ` const`;
  }
  const signature: string = `.function${
    templateSignature ? `<${templateSignature}>` : ''
  }("${methodObject.object.name}", &${methodObject.object.cppInterface})`;
  return signature;
};

const tsMethodSignature = (functionsDefinition: MethodObject): string => {
  let signature: string = `${functionsDefinition.object.name}(`;
  if (functionsDefinition.object.parameters) {
    for (let i = 0; i < functionsDefinition.object.parameters.length; i++) {
      const param = functionsDefinition.object.parameters[i];
      signature += `${param.name}: ${param.tsType || 'any'}`;
      if (i < functionsDefinition.object.parameters.length - 1)
        signature += ', ';
    }
  }
  signature += `) : ${functionsDefinition.object.tsType || 'void'}`;
  return signature;
};

const createTsInterface = (
  containerName: string,
  interfaceDefinitions: InterfaceDefinition
): string => {
  let classInterfaceData: string = '';
  interfaceDefinitions.enums.forEach((element: EnumObject) => {
    classInterfaceData += `export const enum ${element.object.name} {\n`;
    if (element.values) {
      for (let i = 0; i < element.values.length; ++i) {
        classInterfaceData += `    ${element.values[i].object.value}${
          i < element.values.length - 1 ? ',' : ''
        }\n`;
      }
    }
    classInterfaceData += `}\n\n`;
  });
  interfaceDefinitions.vectors.forEach((element: VectorObject) => {
    if (element.object.tsType) {
      classInterfaceData += `export type ${element.object.name} = EmscriptenArray<${element.object.tsType}>;\n\n`;
    }
  });
  interfaceDefinitions.maps.forEach((element: MapObject) => {
    if (element.object.tsKeyType && element.object.tsValueType) {
      classInterfaceData += `export type ${element.object.name} = EmscriptenMap<${element.object.tsKeyType}, ${element.object.tsValueType}>;\n\n`;
    }
  });
  interfaceDefinitions.templates.forEach((element: TemplateObject) => {
    if (element.object.tsType) {
      classInterfaceData += `export type ${element.object.name} = ${element.tsInterface}<${element.object.tsType}>;\n\n`;
    }
  });
  interfaceDefinitions.valueObjects.forEach((element: ValueObjectObject) => {
    classInterfaceData += `export interface ${element.object.name} {\n`;
    element.fields.forEach((fields: FieldObject) => {
      const access =
        fields.object.cppGetter && !fields.object.cppSetter ? 'readonly ' : '';
      classInterfaceData += `    ${access}${fields.object.name}${
        fields.object.optional ? '?' : ''
      }: ${fields.object.tsType || 'any'};\n`;
    });
    classInterfaceData += `}\n\n`;
  });
  interfaceDefinitions.classes.forEach((element: ClassObject) => {
    classInterfaceData += `export interface ${element.object.name} {\n`;
    if (element.constructors.length > 0) {
      classInterfaceData += `    new(): ${element.object.name};\n`;
    }
    element.classFunctions.forEach((functionsDefinition: MethodObject) => {
      const functionSignature = tsMethodSignature(functionsDefinition);
      classInterfaceData += `    ${functionSignature};\n`;
    });
    element.functions.forEach((functionsDefinition: MethodObject) => {
      const functionSignature = tsMethodSignature(functionsDefinition);
      classInterfaceData += `    ${functionSignature};\n`;
    });
    element.properties.forEach((propertyDefinition: PropertyObject) => {
      const access = !propertyDefinition.object.cppSetter ? 'readonly ' : '';
      classInterfaceData += `    ${access}${propertyDefinition.object.name} : ${propertyDefinition.object.tsType};\n`;
    });
    classInterfaceData += `}\n\n`;
  });
  if (interfaceDefinitions.functions || interfaceDefinitions.classes) {
    classInterfaceData += `export interface ${containerName} {\n`;
    interfaceDefinitions.vectors.forEach((element: VectorObject) => {
      classInterfaceData += `    ${element.object.name} : ${element.object.name};\n`;
    });
    interfaceDefinitions.maps.forEach((element: MapObject) => {
      classInterfaceData += `    ${element.object.name} : ${element.object.name};\n`;
    });
    interfaceDefinitions.templates.forEach((element: TemplateObject) => {
      classInterfaceData += `    ${element.object.name} : ${element.object.name};\n`;
    });
    interfaceDefinitions.classes.forEach((element: ClassObject) => {
      classInterfaceData += `    ${element.object.name} : ${element.object.name};\n`;
    });
    interfaceDefinitions.functions.forEach((element: FunctionObject) => {
      const functionSignature = tsMethodSignature(element);
      classInterfaceData += `    ${functionSignature};\n`;
    });
    classInterfaceData += `}`;
  }

  let tsInterfaceData: string = `${classInterfaceData}`;
  return tsInterfaceData;
};

const createCppInterface = (
  interfaceName: string,
  interfaceDefinitions: InterfaceDefinition
): string => {
  let enumInterfaceData: string = '';
  interfaceDefinitions.enums.forEach((element: EnumObject) => {
    enumInterfaceData += `    emscripten::enum_<${element.object.cppType}>("${element.object.name}")\n`;
    element.values.forEach((value: ValueObject) => {
      enumInterfaceData += `        .value("${value.object.value}", ${value.object.cppValue})\n`;
    });
    enumInterfaceData += '        ;\n';
  });
  let valueObjectInterfaceData: string = '';
  interfaceDefinitions.valueObjects.forEach((element: ValueObjectObject) => {
    valueObjectInterfaceData += `    emscripten::value_object<${element.object.cppType}>("${element.object.name}")\n`;
    element.fields.forEach((field: FieldObject) => {
      if (field.object.cppAttribute) {
        const templateSignature: string = field.object.cppType
          ? `<${element.object.cppType}, ${field.object.cppType}>`
          : '';
        valueObjectInterfaceData += `        .field${templateSignature}("${field.object.name}", &${field.object.cppAttribute})\n`;
      } else if (field.object.cppGetter && field.object.cppSetter) {
        let templateSignature: string = '';
        const className = field.object.cppClassType
          ? field.object.cppClassType
          : element.object.cppType;
        if (field.object.perValue) {
          templateSignature = field.object.cppType
            ? `<${field.object.cppType}(*)(const ${className}&), void(*)(${className}&, ${field.object.cppType})>`
            : '';
        } else {
          templateSignature = field.object.cppType
            ? `<${field.object.cppType}(*)(const ${className}&), void(*)(${className}&, const ${field.object.cppType}&)>`
            : '';
        }
        valueObjectInterfaceData += `        .field${templateSignature}("${field.object.name}", ${field.object.cppGetter}, ${field.object.cppSetter})\n`;
      }
    });
    valueObjectInterfaceData += '        ;\n';
  });
  let vectorInterfaceData: string = '';
  interfaceDefinitions.vectors.forEach((element: VectorObject) => {
    vectorInterfaceData += `    emscripten::register_vector<${element.object.cppType}>("${element.object.name}");\n`;
  });
  let mapInterfaceData: string = '';
  interfaceDefinitions.maps.forEach((element: MapObject) => {
    mapInterfaceData += `    emscripten::register_map<${element.object.cppKeyType}, ${element.object.cppValueType}>("${element.object.name}");\n`;
  });
  let templateInterfaceData: string = '';
  interfaceDefinitions.templates.forEach((element: TemplateObject) => {
    templateInterfaceData += `    ${element.cppFactory}<${element.object.cppType}>("${element.object.name}");\n`;
  });
  let classInterfaceData: string = '';
  interfaceDefinitions.classes.forEach((element: ClassObject) => {
    const baseClassSignature = element.object.cppBaseClass
      ? `, ${element.object.cppBaseClass}`
      : '';
    classInterfaceData += `    emscripten::class_<${element.object.cppType}${baseClassSignature}>("${element.object.name}")\n`;
    element.constructors.forEach((constructorDefinition: MethodObject) => {
      if (constructorDefinition.object.preprocessorDefinition) {
        classInterfaceData += `#ifdef ${constructorDefinition.object.preprocessorDefinition}\n`;
      }
      classInterfaceData += `        ${cppSmartPointerConstructorSignature(
        constructorDefinition
      )}\n`;
      if (constructorDefinition.object.preprocessorDefinition) {
        classInterfaceData += '#endif\n';
      }
    });
    element.classFunctions.forEach((classFunctionsDefinition: MethodObject) => {
      if (classFunctionsDefinition.object.preprocessorDefinition) {
        classInterfaceData += `#ifdef ${classFunctionsDefinition.object.preprocessorDefinition}\n`;
      }
      classInterfaceData += `        ${cppClassFunctionSignature(
        classFunctionsDefinition
      )}\n`;
      if (classFunctionsDefinition.object.preprocessorDefinition) {
        classInterfaceData += '#endif\n';
      }
    });
    element.functions.forEach((methodDefinition: MethodObject) => {
      if (methodDefinition.object.preprocessorDefinition) {
        classInterfaceData += `#ifdef ${methodDefinition.object.preprocessorDefinition}\n`;
      }
      classInterfaceData += `        ${cppMethodSignature(
        element.object,
        methodDefinition
      )}\n`;
      if (methodDefinition.object.preprocessorDefinition) {
        classInterfaceData += '#endif\n';
      }
    });
    element.properties.forEach((propertyDefinition: PropertyObject) => {
      const item = propertyDefinition.object;
      if (item.preprocessorDefinition) {
        classInterfaceData += `#ifdef ${item.preprocessorDefinition}\n`;
      }
      const bindingFunction =
        propertyDefinition.object.type === 'class_property'
          ? 'class_property'
          : 'property';
      if (propertyDefinition.object.cppSetter) {
        const templateSignature: string = '';
        classInterfaceData += `        .${bindingFunction}${templateSignature}("${item.name}", &${item.cppGetter}, &${item.cppSetter})\n`;
      } else {
        const templateSignature = '';
        classInterfaceData += `        .${bindingFunction}${templateSignature}("${item.name}", &${item.cppGetter})\n`;
      }
      if (propertyDefinition.object.preprocessorDefinition) {
        classInterfaceData += '#endif\n';
      }
    });
    classInterfaceData += '        ;\n';
  });
  let functionInterfaceData: string = '';
  interfaceDefinitions.functions.forEach((element: FunctionObject) => {
    functionInterfaceData += `    ${cppFunctionSignature(element)};\n`;
  });

  let cppInterfaceData: string = interfaceName
    ? `EMSCRIPTEN_BINDINGS(${interfaceName}) {\n`
    : '';
  cppInterfaceData += `
${functionInterfaceData}
${enumInterfaceData}
${valueObjectInterfaceData}
${vectorInterfaceData}
${mapInterfaceData}
${templateInterfaceData}
${classInterfaceData}`;
  cppInterfaceData += interfaceName ? '\n}' : '';
  return cppInterfaceData;
};

const createMd = (
  interfaceName: string,
  interfaceDefinitions: InterfaceDefinition
): string => {
  let docsData: string = '';
  if (interfaceDefinitions.enums.length > 0) {
    docsData += `## Enums\n\n`;
    interfaceDefinitions.enums.forEach((element: EnumObject) => {
      docsData += `- \`${element.object.name}\` :`;
      for (let i = 0; i < element.values.length; ++i) {
        docsData += `${i > 0 ? ', ' : ' '}${element.values[i].object.value}`;
      }
      docsData += '\n';
    });
    docsData += '\n';
  }
  if (
    interfaceDefinitions.vectors.length > 0 ||
    interfaceDefinitions.maps.length > 0 ||
    interfaceDefinitions.templates.length > 0
  ) {
    docsData += `## Containers\n\n`;
    if (interfaceDefinitions.vectors.length > 0) {
      interfaceDefinitions.vectors.forEach((element: VectorObject) => {
        docsData += `- \`${element.object.name}\` : array of \`${element.object.cppType}\`\n`;
      });
    }
    if (interfaceDefinitions.maps.length > 0) {
      interfaceDefinitions.maps.forEach((element: MapObject) => {
        docsData += `- \`${element.object.name}\` : map of \`${element.object.tsKeyType}\`: \`${element.object.tsValueType}\`\n`;
      });
    }
    if (interfaceDefinitions.templates.length > 0) {
      interfaceDefinitions.templates.forEach((element: TemplateObject) => {
        docsData += `- \`${element.object.name}\` : ${element.tsInterface} of \`${element.object.cppType}\`\n`;
      });
    }
    docsData += '\n';
  }
  if (interfaceDefinitions.valueObjects.length > 0) {
    docsData += `## Objects\n\n`;
    interfaceDefinitions.valueObjects.forEach((element: ValueObjectObject) => {
      docsData += `### \`${element.object.name}\`\n\n`;
      if (element.fields !== undefined && element.fields.length > 0) {
        element.fields.forEach((fields: FieldObject) => {
          docsData += `- \`${fields.object.name}${
            fields.object.optional ? '?' : ''
          }: ${fields.object.tsType || 'any'}\`\n`;
        });
        docsData += `\n`;
      }
    });
  }
  if (interfaceDefinitions.classes.length > 0) {
    docsData += `## Classes\n\n`;
    interfaceDefinitions.classes.forEach((element: ClassObject) => {
      docsData += `### class \`${element.object.name}\`\n\n`;
      if (
        element.classFunctions !== undefined &&
        element.classFunctions.length > 0
      ) {
        docsData += `class methods:\n\n`;
        element.classFunctions.forEach((functionsDefinition: MethodObject) => {
          const functionSignature = tsMethodSignature(functionsDefinition);
          docsData += `- \`${functionSignature}\`\n`;
          if (functionsDefinition.object.description) {
            docsData += `  ${functionsDefinition.object.description}\n`;
          }
        });
        docsData += `\n`;
      }
      if (element.functions !== undefined && element.functions.length > 0) {
        docsData += `methods:\n\n`;
        element.functions.forEach((functionsDefinition: MethodObject) => {
          const functionSignature = tsMethodSignature(functionsDefinition);
          docsData += `- \`${functionSignature}\`\n`;
          if (functionsDefinition.object.description) {
            docsData += `  ${functionsDefinition.object.description}\n\n`;
          }
        });
        docsData += `\n`;
      }
      if (element.properties !== undefined && element.properties.length > 0) {
        docsData += `properties:\n\n`;
        element.properties.forEach((propertyDefinition: PropertyObject) => {
          docsData += `- \`${propertyDefinition.object.name}: ${
            propertyDefinition.object.tsType || 'any'
          }\`\n`;
        });
        docsData += `\n`;
      }
    });
  }
  return docsData;
};
