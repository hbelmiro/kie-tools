/*
 * Copyright 2020 Red Hat, Inc. and/or its affiliates.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *        http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { By, EditorView, InputBox, SideBarView, TextEditor, WebView } from "vscode-extension-tester";
import * as path from "path";
import { h5ComponentWithText, labeledAnyElementInPropertiesPanel } from "./helpers/CommonLocators";
import { EditorTabs } from "./helpers/dmn/EditorTabs";
import { assertWebElementIsDisplayedEnabled } from "./helpers/CommonAsserts";
import VSCodeTestHelper from "./helpers/VSCodeTestHelper";
import BpmnEditorTestHelper, { PaletteCategories } from "./helpers/bpmn/BpmnEditorTestHelper";
import ScesimEditorTestHelper from "./helpers/ScesimEditorTestHelper";
import DmnEditorTestHelper from "./helpers/dmn/DmnEditorTestHelper";
import PmmlEditorTestHelper from "./helpers/PmmlEditorTestHelper";
import { assert } from "chai";
import {
  palletteItemAnchor,
  processVariableDataTypeInput,
  processVariableNameInput,
} from "./helpers/bpmn/BpmnLocators";
import DecisionNavigatorHelper from "./helpers/dmn/DecisionNavigatorHelper";
import { PropertiesPanelSection } from "./helpers/bpmn/PropertiesPanelHelper";
import { TextEdit } from "vscode";
import Correlation from "./helpers/bpmn/Correlation";
import ProcessVariablesWidgetHelper from "./helpers/bpmn/ProcessVariablesWidgetHelper";
import ImplementationExecutionHelper from "./helpers/bpmn/ImplementationExecutionHelper";

describe("Editors are loading properly", () => {
  const RESOURCES: string = path.resolve("it-tests-tmp", "resources");
  const DEMO_BPMN: string = "demo.bpmn";
  const DEMO_DMN: string = "demo.dmn";
  const DEMO_DMN_SCESIM: string = "demo-dmn.scesim";
  const DEMO_EXPRESSION_DMN: string = "demo-expression.dmn";
  const DEMO_SCESIM: string = "demo.scesim";
  const DEMO_PMML: string = "demo.pmml";
  const MULTIPLE_INSTANCE_BPMN: string = "MultipleInstanceSubprocess.bpmn";
  const USER_TASK_BPMN: string = "UserTask.bpmn";

  const REUSABLE_DMN: string = "reusable-model.dmn";
  const WID_BPMN: string = "process-wid.bpmn";

  let testHelper: VSCodeTestHelper;
  let webview: WebView;
  let folderView: SideBarView;

  before(async function () {
    this.timeout(60000);
    testHelper = new VSCodeTestHelper();
    folderView = await testHelper.openFolder(RESOURCES);
  });

  beforeEach(async function () {
    await testHelper.closeAllEditors();
    await testHelper.closeAllNotifications();
  });

  afterEach(async function () {
    this.timeout(15000);
    await testHelper.closeAllEditors();
    await testHelper.closeAllNotifications();
    await webview.switchBack();
  });

  it("Opens demo.bpmn file in BPMN Editor and loads correct diagram", async function () {
    this.timeout(20000);
    webview = await testHelper.openFileFromSidebar(DEMO_BPMN);
    await testHelper.switchWebviewToFrame(webview);
    const bpmnEditorTester = new BpmnEditorTestHelper(webview);

    const palette = await bpmnEditorTester.getPalette();
    await assertWebElementIsDisplayedEnabled(palette);

    await bpmnEditorTester.openDiagramProperties();

    const explorer = await bpmnEditorTester.openDiagramExplorer();
    await explorer.assertDiagramNodeIsPresent("Start");
    await explorer.assertDiagramNodeIsPresent("End");

    await webview.switchBack();
  });

  it("Opens demo.dmn file in DMN Editor", async function () {
    this.timeout(20000);
    webview = await testHelper.openFileFromSidebar(DEMO_DMN);
    await testHelper.switchWebviewToFrame(webview);
    const dmnEditorTester = new DmnEditorTestHelper(webview);

    await dmnEditorTester.openDiagramProperties();
    await dmnEditorTester.openDiagramExplorer();
    await dmnEditorTester.openDecisionNavigator();

    await webview.switchBack();
  });

  it("Include reusable-model in DMN Editor", async function () {
    this.timeout(20000);
    webview = await testHelper.openFileFromSidebar(DEMO_DMN);
    await testHelper.switchWebviewToFrame(webview);
    const dmnEditorTester = new DmnEditorTestHelper(webview);

    await dmnEditorTester.switchEditorTab(EditorTabs.IncludedModels);
    await dmnEditorTester.includeModel(REUSABLE_DMN, "reusable-model");

    // Blocked by https://issues.redhat.com/browse/KOGITO-4261
    // await dmnEditorTester.inspectIncludedModel("reusable-model", 2)

    await dmnEditorTester.switchEditorTab(EditorTabs.Editor);

    await webview.switchBack();
  });

  it("Undo command in DMN Editor", async function () {
    this.timeout(40000);
    webview = await testHelper.openFileFromSidebar(DEMO_DMN);
    await testHelper.switchWebviewToFrame(webview);
    const dmnEditorTester = new DmnEditorTestHelper(webview);

    const decisionNavigator = await dmnEditorTester.openDecisionNavigator();
    await decisionNavigator.selectDiagramNode("?DemoDecision1");

    const diagramProperties = await dmnEditorTester.openDiagramProperties();
    await diagramProperties.changeProperty("Name", "Updated Name 1");

    const navigatorPanel: DecisionNavigatorHelper = await dmnEditorTester.openDecisionNavigator();
    await navigatorPanel.assertDiagramNodeIsPresent("Updated Name 1");
    await navigatorPanel.assertDiagramNodeIsPresent("?DecisionFinal1");

    await webview.switchBack();

    // changeProperty() is implemented as clear() and sendKeys(), that is why we need two undo operations
    await testHelper.executeCommandFromPrompt("Undo");
    await testHelper.executeCommandFromPrompt("Undo");

    await testHelper.switchWebviewToFrame(webview);

    await navigatorPanel.assertDiagramNodeIsPresent("?DemoDecision1");
    await navigatorPanel.assertDiagramNodeIsPresent("?DecisionFinal1");

    await webview.switchBack();
  });

  it("Check new DMN Expression Editor", async function () {
    this.timeout(40000);
    webview = await testHelper.openFileFromSidebar(DEMO_EXPRESSION_DMN);
    await testHelper.switchWebviewToFrame(webview);
    const dmnEditorTester = new DmnEditorTestHelper(webview);

    const decisionNavigator = await dmnEditorTester.openDecisionNavigator();

    await decisionNavigator.selectNodeExpression("context demo", "Context");
    const contextEditor = await dmnEditorTester.getExpressionEditor();
    await contextEditor.activateBetaVersion();
    await contextEditor.assertExpressionDetails("context demo", "string");

    await decisionNavigator.selectNodeExpression("function demo", "Function");
    const functionEditor = await dmnEditorTester.getExpressionEditor();
    await functionEditor.activateBetaVersion();
    await functionEditor.assertExpressionDetails("function demo", "string");

    await decisionNavigator.selectNodeExpression("decision table demo", "Decision Table");
    const decisionTableEditor = await dmnEditorTester.getExpressionEditor();
    await decisionTableEditor.activateBetaVersion();
    await decisionTableEditor.assertExpressionDetails("decision table demo", "string");

    await webview.switchBack();
  });

  it("Opens demo.scesim file in SCESIM Editor", async function () {
    this.timeout(20000);

    webview = await testHelper.openFileFromSidebar(DEMO_SCESIM);
    await testHelper.switchWebviewToFrame(webview);
    const scesimEditorTester = new ScesimEditorTestHelper(webview);

    await scesimEditorTester.openScenarioCheatsheet();
    await scesimEditorTester.openSettings();
    await scesimEditorTester.openTestTools();

    await webview.switchBack();
  });

  /**
   * As the opened sceism file is empty, a prompt to specify file under test should be shown
   */

  it("Opens demo-dmn.scesim file in SCESIM Editor", async function () {
    this.timeout(20000);

    webview = await testHelper.openFileFromSidebar(DEMO_DMN_SCESIM);
    await testHelper.switchWebviewToFrame(webview);
    const scesimEditorTester = new ScesimEditorTestHelper(webview);

    await scesimEditorTester.specifyDmnOnLandingPage(DEMO_DMN);

    await webview.switchBack();

    // save file so we can check the plain text source
    await testHelper.executeCommandFromPrompt("File: Save");

    // check plain text source starts with <?xml?> prolog
    await testHelper.executeCommandFromPrompt("View: Reopen Editor With...");
    const input = await InputBox.create();
    await input.selectQuickPick("Text Editor");

    const xmlProlog = '<?xml version="1.0" encoding="UTF-8"?>';
    const plainText = new TextEditor();
    assert.equal(await plainText.getTextAtLine(1), xmlProlog, "First line should be an <?xml?> prolog");
    assert.notEqual(await plainText.getTextAtLine(2), xmlProlog, "<?xml?> prolog should be there just once");
  });

  it("Opens demo.pmml file in PMML Editor", async function () {
    this.timeout(20000);
    webview = await testHelper.openFileFromSidebar(DEMO_PMML);
    await testHelper.switchWebviewToFrame(webview);
    const pmmlEditorTester = new PmmlEditorTestHelper(webview);

    const dataDictionaryModel = await pmmlEditorTester.openDataDictionary();
    dataDictionaryModel.close();

    const miningSchemaModel = await pmmlEditorTester.openMiningSchema();
    miningSchemaModel.close();

    const outputsModal = await pmmlEditorTester.openOutputs();
    outputsModal.close();

    await webview.switchBack();
  });

  it("Opens process with work item definition properly", async function () {
    this.timeout(20000);
    webview = await testHelper.openFileFromSidebar(WID_BPMN, "src/main/java/org/kie/businessapp");
    await testHelper.switchWebviewToFrame(webview);
    const bpmnEditorTester = new BpmnEditorTestHelper(webview);

    const customTasksPaletteCategory = await bpmnEditorTester.openDiagramPalette(PaletteCategories.CUSTOM_TASKS);
    assertWebElementIsDisplayedEnabled(await customTasksPaletteCategory.findElement(h5ComponentWithText("Milestone")));
    assertWebElementIsDisplayedEnabled(
      await customTasksPaletteCategory.findElement(h5ComponentWithText("CustomTasks"))
    );
    assertWebElementIsDisplayedEnabled(
      await customTasksPaletteCategory.findElement(palletteItemAnchor("CreateCustomer"))
    );
    assertWebElementIsDisplayedEnabled(await customTasksPaletteCategory.findElement(palletteItemAnchor("Email")));

    const explorer = await bpmnEditorTester.openDiagramExplorer();
    await explorer.assertDiagramNodeIsPresent("Create Customer Internal Service");
    await explorer.assertDiagramNodeIsPresent("Start");
    await explorer.assertDiagramNodeIsPresent("Email");
    await explorer.assertDiagramNodeIsPresent("End");

    await explorer.selectDiagramNode("Create Customer Internal Service");
    const propertiesPanel = await bpmnEditorTester.openDiagramProperties();
    await propertiesPanel.assertPropertyValue("Name", "Create Customer Internal Service", "textarea");
    await propertiesPanel.assertPropertyValue(
      "Documentation",
      "Calls internal service that creates the customer in database server.",
      "textarea"
    );
    await propertiesPanel.assertPropertyValue("Assignments", "7 data inputs, 1 data output", "div/input");

    await webview.switchBack();
  });

  it("Saves a change of process name in BPMN editor properly", async function () {
    this.timeout(60000);
    webview = await testHelper.openFileFromSidebar("SaveAssetTest.bpmn");
    await testHelper.switchWebviewToFrame(webview);
    let bpmnEditorTester = new BpmnEditorTestHelper(webview);

    let properties = await bpmnEditorTester.openDiagramProperties();
    let processNameInputField = await properties.getProperty("Name");
    assert.isTrue(await processNameInputField.isEnabled());
    const formerProcessId = await processNameInputField.getAttribute("value");
    assert.isDefined(formerProcessId);
    assert.isNotEmpty(formerProcessId);

    await processNameInputField.sendKeys("Renamed");
    await bpmnEditorTester.openDiagramExplorer();

    await webview.switchBack();

    await testHelper.executeCommandFromPrompt("File: Save");
    await testHelper.closeAllEditors();

    webview = await testHelper.openFileFromSidebar("SaveAssetTest.bpmn");
    await testHelper.switchWebviewToFrame(webview);
    bpmnEditorTester = new BpmnEditorTestHelper(webview);
    properties = await bpmnEditorTester.openDiagramProperties();
    processNameInputField = await properties.getProperty("Name");
    assert.isTrue(await processNameInputField.isEnabled());
    assert.equal(await processNameInputField.getAttribute("value"), formerProcessId + "Renamed");

    await webview.switchBack();
  });

  it("Reuses Data-types across BPMN editor", async function () {
    this.timeout(40000);
    webview = await testHelper.openFileFromSidebar("ReuseDataTypeTest.bpmn");
    await testHelper.switchWebviewToFrame(webview);
    const bpmnEditorTester = new BpmnEditorTestHelper(webview);

    const variableName = "fuelAccelerator";
    const dataTypeType = "com.superbankofpeople.FuelAccelerator";
    const dataTypeTypeBracketFormat = "FuelAccelerator [com.superbankofpeople]";

    let propertiesPanel = await bpmnEditorTester.openDiagramProperties();
    propertiesPanel = await propertiesPanel.addProcessVariable(variableName, dataTypeType, true);

    await bpmnEditorTester.openDiagramExplorer();
    propertiesPanel = await bpmnEditorTester.openDiagramProperties();

    propertiesPanel = await propertiesPanel.expandPropertySection(PropertiesPanelSection.PROCESS_DATA);
    const processVariableNameInputField = await propertiesPanel.rootElement.findElement(processVariableNameInput());
    const processVariableDataTypeInputField = await propertiesPanel.rootElement.findElement(
      processVariableDataTypeInput()
    );
    await bpmnEditorTester.scrollElementIntoView(processVariableNameInputField);
    await processVariableDataTypeInputField.click();
    const customDataTypeEditOption = await processVariableDataTypeInputField.findElement(
      By.xpath("//select/option[@value='Edit " + dataTypeType + " ...']")
    );
    assertWebElementIsDisplayedEnabled(customDataTypeEditOption);

    propertiesPanel = await propertiesPanel.expandPropertySection(PropertiesPanelSection.ADVANCED);
    propertiesPanel = await propertiesPanel.addGlobalVariable(
      "used_fuel_accelerator",
      dataTypeTypeBracketFormat,
      false
    );

    await webview.switchBack();
  });

  it("Opens MultipleInstanceSubprocess.bpmn file in BPMN Editor and test Implementation/Execution value change", async function () {
    this.timeout(40000);
    // Inicialization
    webview = await testHelper.openFileFromSidebar(MULTIPLE_INSTANCE_BPMN);
    await testHelper.switchWebviewToFrame(webview);
    const bpmnEditorTester = new BpmnEditorTestHelper(webview);

    const explorerPanel = await bpmnEditorTester.openDiagramExplorer();
    await explorerPanel.selectDiagramNode("Multiple Instance Sub-Process");

    let propertiesPanel = await bpmnEditorTester.openDiagramProperties();

    // Implementation/Execution
    await propertiesPanel.expandPropertySection(PropertiesPanelSection.IMPLEMENTATION_EXECUTION);
    let onEntryActionSection = await propertiesPanel.getProperty("On Entry Action", "div");
    await bpmnEditorTester.scrollElementIntoView(onEntryActionSection);

    const implementationExecutionHelper = new ImplementationExecutionHelper(propertiesPanel.rootElement);

    const newProcessMIExecutionValue = "Sequential";
    await implementationExecutionHelper.changeProperty("MI Execution mode", newProcessMIExecutionValue, "select");

    const newProcessMICollectionInput = "subProcessInput";
    await implementationExecutionHelper.changeProperty("MI Collection input", newProcessMICollectionInput, "select");

    const newProcessMIDataInputName = "newInput";
    const newProcessMIDataInputType = "java.util.List<String>";
    let MIDataInputWidget = await implementationExecutionHelper.getMIDataInputWidget();
    await MIDataInputWidget.setMIDataInput(newProcessMIDataInputName);
    await MIDataInputWidget.setMIDataInputDataType(newProcessMIDataInputType);

    const newProcessMICollectionOutput = "subProcessOutput";
    await propertiesPanel.changeProperty("MI Collection output", newProcessMICollectionOutput, "select");

    const newProcessMIDataOutputName = "newOutput";
    const newProcessMIDataOutputType = "java.util.List<String>";
    let MIDataOutputWidget = await implementationExecutionHelper.getMIDataOutputWidget();
    await MIDataOutputWidget.setMIDataInput(newProcessMIDataOutputName);
    await MIDataOutputWidget.setMIDataInputDataType(newProcessMIDataOutputType);

    const newMvelExpression = "0 == 0;";
    await propertiesPanel.changeProperty("MI Completion Condition (mvel)", newMvelExpression, "textarea");

    await propertiesPanel.expandPropertySection(PropertiesPanelSection.IMPLEMENTATION_EXECUTION); // collapse section

    // Process Data
    await propertiesPanel.addProcessVariable("123", "Integer", false);

    await bpmnEditorTester.openDiagramExplorer();
    await bpmnEditorTester.openDiagramProperties();
    await propertiesPanel.expandPropertySection(PropertiesPanelSection.IMPLEMENTATION_EXECUTION);

    // Asserts
    await implementationExecutionHelper.assertPropertyValue("MI Execution mode", newProcessMIExecutionValue, "select");
    await implementationExecutionHelper.assertPropertyValue(
      "MI Collection input",
      newProcessMICollectionInput,
      "select"
    );
    await propertiesPanel.assertPropertyValue("MI Collection output", newProcessMICollectionOutput, "select");
    MIDataInputWidget = await implementationExecutionHelper.getMIDataInputWidget();
    await MIDataInputWidget.assertMiDataInput(newProcessMIDataInputName, newProcessMIDataInputType);
    MIDataOutputWidget = await implementationExecutionHelper.getMIDataOutputWidget();
    await MIDataOutputWidget.assertMiDataInput(newProcessMIDataOutputName, newProcessMIDataOutputType);
    await propertiesPanel.assertPropertyValue("MI Completion Condition (mvel)", newMvelExpression, "textarea");

    await webview.switchBack();
  });

  it("Opens UserTask.bpmn file in BPMN Editor and test On Entry and On Exit actions", async function () {
    this.timeout(20000);
    webview = await testHelper.openFileFromSidebar(USER_TASK_BPMN);
    await testHelper.switchWebviewToFrame(webview);
    const bpmnEditorTester = new BpmnEditorTestHelper(webview);

    const explorerPanel = await bpmnEditorTester.openDiagramExplorer();
    await explorerPanel.selectDiagramNode("User Task");

    let propertiesPanel = await bpmnEditorTester.openDiagramProperties();

    await propertiesPanel.expandPropertySection(PropertiesPanelSection.IMPLEMENTATION_EXECUTION);

    let onExitActionSection = await propertiesPanel.getProperty("On Exit Action", "div");
    await bpmnEditorTester.scrollElementIntoView(onExitActionSection);

    const newOnEntryAction = "console.log('On Entry Action test log');";
    const newOnEntryLanguage = "javascript";
    await propertiesPanel.changeWidgetedProperty("On Entry Action", newOnEntryAction, "textarea");
    await propertiesPanel.changeWidgetedProperty("On Entry Action", newOnEntryLanguage, "select");

    const newOnExitAction = "console.log('On Exit Action test log');";
    const newOnExitLanguage = "javascript";
    await propertiesPanel.changeWidgetedProperty("On Exit Action", newOnExitAction, "textarea");
    await propertiesPanel.changeWidgetedProperty("On Exit Action", newOnExitLanguage, "select");

    await bpmnEditorTester.openDiagramExplorer();
    await bpmnEditorTester.openDiagramProperties();
    await propertiesPanel.expandPropertySection(PropertiesPanelSection.IMPLEMENTATION_EXECUTION);

    // Asserts
    await propertiesPanel.assertWidgetedPropertyValue("On Entry Action", newOnEntryAction, "textarea");
    await propertiesPanel.assertWidgetedPropertyValue("On Entry Action", newOnEntryLanguage, "select");
    await propertiesPanel.assertWidgetedPropertyValue("On Exit Action", newOnExitAction, "textarea");
    await propertiesPanel.assertWidgetedPropertyValue("On Exit Action", newOnExitLanguage, "select");

    await webview.switchBack();
  });

  it("Opens ProcessWithGenerics.bpmn file in BPMN Editor and validate collaborations.", async function () {
    this.timeout(40000);
    webview = await testHelper.openFileFromSidebar("ProcessWithCollaboration.bpmn");
    await testHelper.switchWebviewToFrame(webview);
    const bpmnEditorTester = new BpmnEditorTestHelper(webview);

    let propertiesPanel = await bpmnEditorTester.openDiagramProperties();
    const correllationsModalHelper = await propertiesPanel.getCollerationModalHelper();

    correllationsModalHelper.assertCorrelationsContain(
      new Correlation("CK_ID_1", "CK Name 1", "CP_ID_1", "CP Name 1", "Object")
    );
    correllationsModalHelper.assertCorrelationsContain(
      new Correlation("CK_ID_2", "CK Name 1", "CP_ID_2", "CP Name 2", "Integer")
    );
    correllationsModalHelper.assertCorrelationsContain(
      new Correlation("CK_ID_3", "CK Name 2", "CP_ID_3", "CP Name 3", "Boolean")
    );
    correllationsModalHelper.assertCorrelationsContain(
      new Correlation("CK_ID_4", "CK Name 3", "CP_ID_4", "CP Name 4", "java.util.ArrayList<String>")
    );
    await correllationsModalHelper.assertCorrelationsSize(4);
    await correllationsModalHelper.closeModal();

    let diagramExplorer = await bpmnEditorTester.openDiagramExplorer();
    await diagramExplorer.selectDiagramNode("startMessage");
    propertiesPanel = await bpmnEditorTester.openDiagramProperties();
    await propertiesPanel.expandPropertySection(PropertiesPanelSection.CORRELATION);
    await propertiesPanel.assertPropertyValue("Property", "CK Name 1 - CP Name 1", "select");
    await propertiesPanel.assertPropertyValue("Message Expression Type", "Object", "div/select");
    await propertiesPanel.assertPropertyValue("Data Expression Type", "Object", "div/select");

    diagramExplorer = await bpmnEditorTester.openDiagramExplorer();
    await diagramExplorer.selectDiagramNode("boundaryEventMessage");
    propertiesPanel = await bpmnEditorTester.openDiagramProperties();
    await propertiesPanel.expandPropertySection(PropertiesPanelSection.CORRELATION);
    await propertiesPanel.assertPropertyValue("Property", "CK Name 1 - CP Name 2", "select");
    await propertiesPanel.assertPropertyValue("Message Expression Type", "Integer", "div/select");
    await propertiesPanel.assertPropertyValue("Data Expression Type", "Integer", "div/select");

    diagramExplorer = await bpmnEditorTester.openDiagramExplorer();
    await diagramExplorer.selectDiagramNode("catchMessage");
    propertiesPanel = await bpmnEditorTester.openDiagramProperties();
    await propertiesPanel.expandPropertySection(PropertiesPanelSection.CORRELATION);
    await propertiesPanel.assertPropertyValue("Property", "CK Name 3 - CP Name 4", "select");
    await propertiesPanel.assertPropertyValue("Message Expression Type", "java.util.ArrayList<String>", "div/select");
    await propertiesPanel.assertPropertyValue("Data Expression Type", "java.util.ArrayList<String>", "div/select");

    await webview.switchBack();
  });

  it("Opens ProcessWithGenerics and diplays the generic types", async function () {
    this.timeout(40000);
    webview = await testHelper.openFileFromSidebar("ProcessWithGenerics.bpmn");
    await testHelper.switchWebviewToFrame(webview);
    const bpmnEditorTester = new BpmnEditorTestHelper(webview);

    let propertiesPanel = await bpmnEditorTester.openDiagramProperties();
    const processVariablesWidget = await propertiesPanel.getProcessVariablesHelper();

    await processVariablesWidget.assertProcessVariablesContain("map_generic_var", "java.util.Map<K,V>");
    await processVariablesWidget.assertProcessVariablesContain("list_generic_var", "java.util.List<String>");
    await processVariablesWidget.assertProcessVariablesContain(
      "map_list_generic",
      "java.util.Map<java.util.List<String>,java.util.List<String>>"
    );
    await processVariablesWidget.assertProcessVariablesSize(3);

    const explorer = await bpmnEditorTester.openDiagramExplorer();
    await explorer.selectDiagramNode("Task");
    propertiesPanel = await bpmnEditorTester.openDiagramProperties();

    const dataAssignmentsModalHelper = await propertiesPanel.getDataAssignmentsModalHelper();
    await dataAssignmentsModalHelper.assertDataInputContain("m_input", "java.util.List<String>", "map_generic_var");

    await webview.switchBack();
  });
});
