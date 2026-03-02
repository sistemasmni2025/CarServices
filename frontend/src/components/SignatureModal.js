import React, { useRef } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Dimensions, ScrollView, Image, Platform } from 'react-native';
import SignatureScreen from 'react-native-signature-canvas';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

const CONTRACT_BODY = `CONTRATO DE PRESTACIÓN DE SERVICIOS DE REPARACIÓN Y/O MANTENIMIENTO DE VEHÍCULO, QUE CELEBRAN POR UNA PARTE MULTILLANTAS NIETO SA DE CV COMO "EL PRESTADOR DEL SERVICIO", Y POR LA OTRA PARTE _________________________________ COMO "EL CONSUMIDOR", A QUIENES DE MANERA CONJUNTA SE LES DENOMINARÁ COMO "LAS PARTES", AL TENOR DE LAS SIGUIENTES DECLARACIONES Y CLÁUSULAS:

DECLARACIONES

I.- Declara "EL PRESTADOR DEL SERVICIO":

a) : Ser una persona moral legalmente constituida conforme a las leyes mexicanas, lo que se acredita con el testimonio de la escritura pública número 3782, de fecha 16/10/1992 otorgada ante la fe del (la) Lic. JORGE GARCIA RAMIREZ Notario Público número 22, en QUERÉTARO, e inscrita en el Registro Público de Comercio de QUERÉTARO bajo el número 75 libro CXVII, de fecha 19/01/1993, y que el LIC ALEJANDRO BALDERAS DEL RIO en su carácter de representante legal, en este acto interviene con las facultades que se le confieren en el testimonio de la escritura pública número 12997, de fecha 29/09/1998, otorgada ante la fe del (la) Lic. JORGE GARCIA RAMIREZ, Notario Público número 22 del QUERÉTARO, misma que se encuentra inscrita en el Registro Público de Comercio, bajo el número 0440/5, y que dichas facultades no le han sido revocadas, modificadas o limitadas a la fecha de firma de este Contrato.

b) Dentro de las actividades que constituyen su objeto social, se encuentra prevista la de COMPRA-VENTA DISTRIBUCIÓN, REPARACIÓN E INSTALACIÓN DE TODO TIPO DE LLANTAS, CÁMARAS, RINES, REFACCIONES, Y ACCESORIOS PARA TODA CLASE DE VEHÍCULOS; así como manifiesta contar con los recursos humanos, materiales y financieros adecuados y experiencia suficiente para obligarse a lo estipulado en el presente Contrato.

c) Su domicilio se encuentra ubicado en AV. 5 DE FEBRERO #230, COL. ZONA INDUSTRIAL BENITO JUÁREZ, SANTIAGO DE QUERÉTARO, QUERÉTARO, C.P. 76120, el cual señala como domicilio convencional para todos los efectos legales del presente Contrato.

d) Se encuentra inscrita en el Registro Federal de Contribuyentes con la clave MNI921016FAA.

e) Cuenta con número de registro SIEM: NO APLICA.

f) Cuenta con la infraestructura, los elementos propios, los recursos técnicos y humanos suficientes para cumplir con sus obligaciones conforme a lo establecido en el presente Contrato.

g) Cumple con las licencias, permisos, avisos, certificados y autorizaciones previstas en las disposiciones legales y normas vigentes que corresponden.

h) Para la atención de dudas, aclaraciones, reclamaciones o para proporcionar servicios de orientación, señala el teléfono 4422171710 EXT 7016 y correo electrónico jorge.hernandez@mni.com.mx con un horario de atención de 9:00 horas a 19:00 horas.

i) Indicó al EL CONSUMIDOR el costo total del servicio objeto del presente Contrato.

II.- DECLARA "EL CONSUMIDOR":

a. Llamarse como ha quedado plasmado en el proemio de este Contrato.

b. Que es su deseo obligarse en los términos y condiciones del presente Contrato, manifestando que cuenta con la capacidad legal para la celebración de este Contrato.

c. Su domicilio se encuentra ubicado en la calle _________________ número _____, Colonia _____________, Delegación _____________, Código Postal _________, en _____________, el cual señala como domicilio convencional para todos los efectos legales del presente Contrato.

d. Se encuentra inscrito en el Registro Federal de Contribuyentes con la clave _______________.

En virtud de las Declaraciones anteriores, "Las partes" convienen en obligarse conforme a las siguientes:

                                                                              CLÁUSULAS

PRIMERA. CONSENTIMIENTO.- LAS PARTES de común acuerdo manifiestan su voluntad para celebrar el presente Contrato cuya naturaleza jurídica es la Reparación y/o mantenimiento de vehículo.

SEGUNDA. OBJETO.- El objeto del presente Contrato es que EL PRESTADOR DEL SERVICIO realizará las operaciones y composturas descritas en el anverso del presente Contrato, solicitadas por EL CONSUMIDOR previo pago de un precio cierto y determinado y a las que se someterá el vehículo para obtener condiciones de funcionamiento de acuerdo al estado de éste. Asimismo EL PRESTADOR DEL SERVICIO no condicionará la prestación del servicio de reparación y/o mantenimiento del vehículo a la adquisición o renta de otros productos o servicios en el establecimiento o en otro taller o agencia.

TERCERA.- COSTO DEL SERVICIO.- El precio total del servicio contratado se establece en el presupuesto que forma parte del presente Contrato. EL CONSUMIDOR al momento de celebrar el presente Contrato deberá realizar el primer pago por concepto de anticipo y el resto en la fecha de entrega del vehículo, dichas cantidades se indican en el anverso del presente Contrato. Todo pago efectuado por EL CONSUMIDOR deberá realizarse en el establecimiento de EL PRESTADOR DEL SERVICIO, al contado, en efectivo, con tarjeta de débito, tarjeta de crédito, transferencia bancaria o cheque, en moneda nacional, sin menoscabo de poderlo hacer en moneda extranjera al tipo de cambio publicado en el Diario Oficial de la Federación al día en que el pago se efectúe.

En caso de que EL CONSUMIDOR realice el pago con cheque y no se cubra el pago por causas imputables al librador, EL PRESTADOR DEL SERVICIO se reserva el derecho de realizar el cobro adicional del 20% (veinte por ciento) del valor del documento, por concepto de daños y perjuicios, en caso de que el cheque sea devuelto por causas imputables al librador, conforme al artículo 193 de la Ley General del Títulos y Operaciones de Crédito.

En cualquier caso, EL PRESTADOR DEL SERVICIO se obliga a emitir y entregar a EL CONSUMIDOR la factura correspondiente o documento fiscal que ampare los cobros realizados por la prestación del Servicio proporcionado conforme a la legislación correspondiente.

EL PRESTADOR DEL SERVICIO pondrá a disposición de EL CONSUMIDOR los precios de los servicios, mano de obra, refacciones y materiales a usar en las reparaciones ofrecidas. Asimismo, previo a la realización del servicio EL PRESTADOR DEL SERVICIO presentará a EL CONSUMIDOR el presupuesto. Una vez aprobado el presupuesto por EL CONSUMIDOR, EL PRESTADOR DEL SERVICIO procederá a efectuar el servicio solicitado. Los incrementos que resulten durante la reparación por costos no previsibles deberán ser autorizados por EL CONSUMIDOR, en forma escrita, siempre y cuando éstos excedan al 20% del presupuesto. Si el incremento citado es inferior lo podrán autorizar telefónicamente. El tiempo, que en su caso, transcurra para requisitar esta condición se modificará la fecha de entrega, en la misma proporción.

El importe señalado en el Presupuesto, contempla todas las cantidades y conceptos referentes al objeto del presente Contrato; por lo que EL PRESTADOR DEL SERVICIO se obliga a respetar en todo momento dicho costo sin poder cobrar otra cantidad no estipulada en el presente Contrato, por lo que cualquier otro costo no previsto en el presente Contrato, deberá ser autorizado de manera escrita por EL CONSUMIDOR.

CUARTA.- ENTREGA DEL VEHÍCULO.- La entrega del vehículo será en la fecha contemplada en el anverso del presente Contrato. Para el caso de que EL CONSUMIDOR, sea el que proporcione las refacciones la fecha de entrega será __________________.

QUINTA.- REFACCIONES Y PARTES PARA LA PRESTACIÓN DEL SERVICIO.- EL PRESTADOR DEL SERVICIO exclusivamente utilizará para los servicios objeto de este Contrato, partes, refacciones u otros materiales nuevos y apropiados para el vehículo, salvo que EL CONSUMIDOR autorice expresamente que se usen otras. Si EL PRESTADOR DEL SERVICIO autoriza, EL CONSUMIDOR suministrará las partes, refacciones o materiales necesarios para la reparación y/o mantenimiento del vehículo. En ambos casos, la autorización respectiva se hará constar en el anverso de presente Contrato.

SEXTA.- ENTREGA DE LAS PARTES O REFACCIONES.- EL PRESTADOR DEL SERVICIO hará entrega de las refacciones, partes o piezas sustituidas en la reparación y/o mantenimiento del vehículo al momento de entrega de éste, salvo en los siguientes casos:

a. Cuando EL CONSUMIDOR, exprese lo contrario.

b. Las partes, refacciones o piezas sean cambiadas en uso de garantía.

c. Se trate de residuos considerados peligrosos de acuerdo con las disposiciones legales aplicables.

SÉPTIMA. OBLIGACIONES DE LAS PARTES.-

EL PRESTADOR DEL SERVICIO SE OBLIGA A:

a. Cumplir con lo establecido en el presente Contrato.

b. Entregar a EL CONSUMIDOR las refacciones o partes del vehículo que haya cambiado a la entrega del vehículo.

c. Entregar el vehículo en las fechas establecidas en el presente Contrato.

d. Proporcionar la información necesaria que sea solicitada por EL CONSUMIDOR, en relación con el presente Contrato.

e. Cumplir ante cualquier percance en caso de subcontratar los servicios.

EL CONSUMIDOR SE OBLIGA A:

a. Cumplir con lo establecido en el presente Contrato.

b. Proporcionar a EL PRESTADOR DEL SERVICIO el vehículo en la fecha y horario establecido en el presente Contrato.

c. Entregar a EL PRESTADOR DEL SERVICIO las refacciones o partes que le haya solicitado éste último.

d. Recoger el vehículo en la fecha establecida en este Contrato.

e. En caso del que el servicio sea prestado en el domicilio indicado por EL CONSUMIDOR, debera permitir el paso previa identificación del PRESTADOR DEL SERVICIO.

f. Hacer los pagos correspondientes establecidos en este Contrato en tiempo.

OCTAVA.- GARANTIA DE LA PRESTACIÓN DEL SERVICIO.- Las reparaciones a que se refiere el presupuesto aceptado por EL CONSUMIDOR, tienen una garantía de 90 (noventa) días contados a partir de la fecha de entrega del vehículo ya reparado en mano de obra y en refacciones la especificada por el fabricante, siempre y cuando no se manifieste mal uso, negligencia o descuido.

Si el vehículo es intervenido por un tercero, EL PRESTADOR DEL SERVICIO no será responsable y la garantía quedará sin efecto. Las reclamaciones por garantía se harán en el establecimiento de EL PRESTADOR DEL SERVICIO, para lo cual EL CONSUMIDOR, deberá presentar su vehículo en dicho establecimiento.

Las reparaciones efectuadas por EL PRESTADOR DEL SERVICIO en cumplimiento a la garantía del servicio, serán sin cargo alguno para EL CONSUMIDOR, salvo aquellos trabajos que no deriven de las reparaciones aceptadas en el presupuesto. No se computará dentro del plazo de garantía, el tiempo que dure la reparación y/o mantenimiento del vehículo para el cumplimiento de la misma. Los gastos en que incurra EL CONSUMIDOR para hacer válida la garantía en un domicilio diverso al de EL PRESTADOR DEL SERVICIO, deberán ser cubiertos por éste.

NOVENA.-PRUEBAS DEL VEHÍCULO.- EL CONSUMIDOR, autoriza el uso del vehículo en zonas aledañas con un radio de 5 kilómetros al área del establecimiento, a efecto de pruebas o verificación de las reparaciones a efectuar o efectuadas. EL PRESTADOR DEL SERVICIO no podrá utilizar el vehículo para uso personal, fines propios o de terceros.

DÉCIMA.- RESPONSABILIDAD POR DAÑOS AL VEHÍCULO.- EL PRESTADOR DEL SERVICIO se hace responsable por los daños causados al vehículo de EL CONSUMIDOR, como consecuencia de los recorridos de prueba por parte del personal de EL PRESTADOR DEL SERVICIO. El riesgo en un recorrido de prueba, es por cuenta de EL CONSUMIDOR, cuando él mismo solicite que será él o un representante suyo quién guié el vehículo. Asimismo, EL PRESTADOR DEL SERVICIO se hace responsable por las descomposturas, daños, perdidas parciales o totales, imputables a él o a sus empleados, que sufra el vehículo, el equipo y aditamentos que EL CONSUMIDOR haya notificado al momento de la recepción del vehículo, mientras se encuentren bajo su responsabilidad para llevar a cabo la reparación y/o mantenimiento solicitado así como para hacer efectiva la garantía otorgada. Para tal efecto EL PRESTADOR DEL SERVICIO si ( ) no ( ) cuenta con seguro para cubrir dichas eventualidades, cuyo número de póliza es ____________ con la compañía ____________.

EL PRESTADOR DEL SERVICIO no se hace responsable por la pérdida de objetos dejados en el interior del vehículo, aún con la cajuela cerrada, salvo que éstos hayan sido notificados y puestos bajo su resguardo al momento de la recepción del vehículo.

DÉCIMA PRIMERA.- CAUSAS DE RESCISIÓN.- son causas de rescisión:

a) Que alguna de LAS PARTES no cumpla con lo estipulado en el presente Contrato.

b) Si el Servicio prestado no corresponde con lo pactado y/o solicitado por EL CONSUMIDOR.

En caso de rescisión del presente Contrato, la parte que incumpla deberá de pagar lo correspondiente a la pena convencional.

DÉCIMA SEGUNDA.- PENA CONVENCIONAL.- Se establece como pena convencional por el incumplimiento de cualquiera de las partes a las obligaciones contraídas en el presente Contrato, el 15% (quince por ciento) del precio total de la Prestación del Servicio de reparación o mantenimiento del vehículo sin incluir el Impuesto al Valor Agregado (IVA).

Esta sanción se estipula por el simple retraso en el cumplimiento de las obligaciones y que la prestación del Servicio no sea prestado conforme a lo establecido en el presente Contrato, sin perjuicio del derecho que tienen LAS PARTES de optar entre exigir el cumplimiento del Contrato o rescindirlo.

LAS PARTES en caso de que requieran el pago de la Pena convencional por cualquiera de los supuestos señalados en la Cláusula décima, deberán de solicitar por escrito en el domicilio de la parte que incumplió, el pago de dichas penas, debiendo hacer el pago la parte que incumplió en los 5 (cinco) días hábiles siguientes de haber recibido dicha solicitud.

DÉCIMA TERCERA.- ENTREGA DEL VEHÍCULO.- En caso de que el vehículo no sea recogido por EL CONSUMIDOR en un plazo de 48 horas a partir de la fecha señalada para la entrega, pagará por concepto de depósito un salario mínimo vigente en el lugar que se celebre el presente Contrato, por cada 24 hrs. que transcurran.

DÉCIMA CUARTA.- CANCELACIÓN DEL CONTRATO.- EL CONSUMIDOR cuenta con un plazo de 5 (cinco) días hábiles posteriores a la firma del presente Contrato para cancelar la operación sin responsabilidad y penalización alguna de su parte, en cuyo caso EL PRESTADOR DEL SERVICIO se obliga a reintegrar todas las cantidades que EL CONSUMIDOR le haya entregado, en un plazo de 5 (cinco) días naturales posteriores a la solicitud de cancelación. La cancelación aplica siempre y cuando EL PRESTADOR DEL SERVICIO no haya iniciado el Servicio objeto del presente Contrato.

Las cancelaciones deberán solicitarse por escrito en el domicilio señalado en el presente Contrato o bien, por correo registrado o certificado, tomando como fecha de revocación la de recepción para su envío.

DÉCIMA QUINTA.- SUBCONTRATACIÓN.- En caso de que EL PRESTADOR DEL SERVICIO desee subcontratar la prestación del Servicio, deberá hacerlo del conocimiento a EL CONSUMIDOR al momento de la firma del presente Contrato. Cualquier incumplimiento a lo establecido en el presente Contrato, EL PRESTADOR DEL SERVICIO responderá ante EL CONSUMIDOR por dicho incumplimiento.

DÉCIMA SEXTA.- PRESTACIÓN DEL SERVICIO EN EL DOMICILIO DEL CONSUMIDOR.- Cuando la prestación del Servicio se vaya a llevar a cabo en el domicilio señalado por EL CONSUMIDOR, el personal de EL PRESTADOR DEL SERVICIO debe identificarse plenamente ante EL CONSUMIDOR, mediante la presentación del documento que lo acredite para este propósito. En caso de que dicho servicio tenga un costo, éste se indicará en el anverso del presente Contrato.

DÉCIMA SÉPTIMA.- NO RESPONSABILIDAD DEL PRESTADOR DEL SERVICIO.- EL CONSUMIDOR libera a EL PRESTADOR DEL SERVICIO de cualquier responsabilidad que hubiere surgido o pudiese surgir con relación al origen, propiedad, posesión o cualquier otro derecho inherente al vehículo, partes o componentes del mismo.

DÉCIMA OCTAVA.- AVISO DE PRIVACIDAD.- Previo a la firma del presente Contrato y en cumplimiento a lo dispuesto en la Ley Federal de Protección de Datos Personales en Posesión de los Particulares, EL PRESTADOR DEL SERVICIO hizo del conocimiento a EL CONSUMIDOR del aviso de privacidad, el cual se encuentra en https://multillantasnieto.mx/aviso-de-privacidad/, así como del ejercicio de sus derechos de acceso, rectificación, cancelación y oposición al tratamiento de sus datos personales(en adelante, derechos ARCO).

DÉCIMA NOVENA.- La Procuraduría Federal del Consumidor es competente en la vía administrativa para resolver cualquier controversia que se suscite sobre la interpretación o cumplimiento del presente Contrato. Sin perjuicio de lo anterior, LAS PARTES se someten a la jurisdicción de los Tribunales competentes en __________________ renunciando expresamente a cualquier otra jurisdicción que pudiera corresponderles, por razón de sus domicilios presentes o futuros o por cualquier otra razón.

Leído que fue por las partes el contenido del presente contrato y sabedoras de su alcance legal, lo firman por duplicado en la Ciudad de ________________________________________________ a los __________ días de mes de ____________________ del año __________.`;

const CONTRACT_AUTH = `Autorización para la utilización de información con fines mercadotécnicos o publicitarios.
EL CONSUMIDOR si ( ) no ( ) acepta que EL PRESTADOR DEL SERVICIO ceda o transmita a terceros, con fines mercadotécnicos o publicitarios, la información proporcionada por él con motivo del presente Contrato y si ( ) no ( ) acepta que EL PRESTADOR DEL SERVICIO le envíe publicidad sobre bienes y servicios.`;

const CONTRACT_REG = `Este contrato fue aprobado y registrado por la Procuraduría Federal del Consumidor bajo el número 8294-2018 de fecha 28 DE AGOSTO DE 2018. Cualquier variación del presente Contrato en perjuicio de EL CONSUMIDOR, frente al Contrato de adhesión registrado, se tendrá por no puesta.`;

const SignatureModal = ({ visible, onClose, onSave }) => {
    /**
     * Modal de Captura de Firma.
     * Utiliza un Canvas (WebView) para capturar el trazo del usuario.
     * Convierte el trazo a imagen Base64 para guardado.
     */
    const signatureRef = useRef(null);
    const [providerSignature, setProviderSignature] = React.useState(null);
    const [consumerSignature, setConsumerSignature] = React.useState(null);
    const [activeSigner, setActiveSigner] = React.useState(null); // 'provider' | 'consumer' | null

    const handleSignature = (signature) => {
        if (activeSigner === 'provider') {
            setProviderSignature(signature);
        } else if (activeSigner === 'consumer') {
            setConsumerSignature(signature);
        }
        setActiveSigner(null);
    };

    const handleClear = () => {
        if (signatureRef.current) {
            signatureRef.current.clearSignature();
        }
    };

    const handleConfirm = () => {
        if (signatureRef.current) {
            signatureRef.current.readSignature();
        }
    };

    const handleSaveDocument = () => {
        if (consumerSignature && providerSignature) {
            onSave(consumerSignature); // Assuming onSave only needs consumer signature, adjust if both are needed
            onClose();
        } else {
            // Ideally trigger alert, but sticking to logic
        }
    };

    const startSigning = (signer) => {
        setActiveSigner(signer);
    };

    if (!visible) return null;

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={false}
            onRequestClose={onClose}
        >
            <View style={styles.container}>
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Contrato de Servicio</Text>
                    <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                        <MaterialCommunityIcons name="close" size={28} color="#333" />
                    </TouchableOpacity>
                </View>

                <View style={{ flex: 1 }}>
                    <ScrollView style={styles.contractContainer} contentContainerStyle={styles.contractContent}>
                        <Text style={styles.contractText}>{CONTRACT_BODY}</Text>

                        <View style={styles.sectionDivider} />
                        <Text style={styles.contractText}>{CONTRACT_AUTH}</Text>

                        <View style={styles.sectionDivider} />
                        <Text style={styles.contractText}>{CONTRACT_REG}</Text>

                        <View style={styles.signatureRow}>
                            <View style={styles.signatureBox}>
                                <Text style={styles.signatureLabel}>EL PRESTADOR DEL SERVICIO</Text>
                                <TouchableOpacity style={styles.signatureTouchArea} onPress={() => startSigning('provider')}>
                                    {providerSignature ? (
                                        <Image source={{ uri: providerSignature }} style={styles.signatureImage} resizeMode="contain" />
                                    ) : (
                                        <View style={styles.placeholderBox}>
                                            <MaterialCommunityIcons name="pen" size={24} color="#007bff" />
                                            <Text style={styles.placeholderText}>Toca para firmar</Text>
                                        </View>
                                    )}
                                </TouchableOpacity>
                                <View style={styles.signatureLine} />
                            </View>

                            <View style={styles.signatureBox}>
                                <Text style={styles.signatureLabel}>EL CONSUMIDOR</Text>
                                <TouchableOpacity style={styles.signatureTouchArea} onPress={() => startSigning('consumer')}>
                                    {consumerSignature ? (
                                        <Image source={{ uri: consumerSignature }} style={styles.signatureImage} resizeMode="contain" />
                                    ) : (
                                        <View style={styles.placeholderBox}>
                                            <MaterialCommunityIcons name="pen" size={24} color="#007bff" />
                                            <Text style={styles.placeholderText}>Toca para firmar</Text>
                                        </View>
                                    )}
                                </TouchableOpacity>
                                <View style={styles.signatureLine} />
                            </View>
                        </View>
                    </ScrollView>

                    <View style={styles.mainFooter}>
                        <TouchableOpacity
                            style={[
                                styles.button,
                                styles.saveButton,
                                { flex: 0, width: '100%' },
                                (!consumerSignature || !providerSignature) && styles.disabledButton
                            ]}
                            onPress={handleSaveDocument}
                            disabled={!consumerSignature || !providerSignature}
                        >
                            <Text style={[styles.buttonText, { fontSize: 16 }]}>Guardar</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Nested Modal for Signature Pad - keeps main ScrollView mounted */}
                <Modal
                    visible={!!activeSigner}
                    animationType="slide"
                    transparent={true}
                    onRequestClose={() => setActiveSigner(null)}
                >
                    <View style={styles.modalOverlay}>
                        <View style={styles.signatureModalContent}>
                            <Text style={styles.signingTitle}>
                                Firmando como: {activeSigner === 'provider' ? 'PRESTADOR DEL SERVICIO' : 'EL CONSUMIDOR'}
                            </Text>

                            {Platform.OS === 'web' ? (
                                <View style={styles.canvasContainer}>
                                    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
                                        <MaterialCommunityIcons name="alert-circle-outline" size={48} color="#dc3545" />
                                        <Text style={{ textAlign: 'center', marginTop: 10, color: '#666' }}>
                                            La captura de firma con lienzo no está soportada en el simulador Web.
                                        </Text>
                                        <TouchableOpacity
                                            style={[styles.button, styles.saveButton, { marginTop: 20, width: '80%' }]}
                                            onPress={() => handleSignature("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=")}
                                        >
                                            <Text style={styles.buttonText}>Simular Firma (Modo Testing)</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            ) : (
                                <View style={styles.canvasContainer}>
                                    <SignatureScreen
                                        ref={signatureRef}
                                        onOK={handleSignature}
                                        descriptionText={activeSigner === 'provider' ? "Firma del Prestador" : "Firma del Consumidor"}
                                        clearText="Limpiar"
                                        confirmText="Confirmar"
                                        autoClear={false}
                                        imageType="image/png"
                                        webStyle={`.m-signature-pad--footer {display: none; margin: 0px;}`}
                                    />
                                </View>
                            )}

                            <View style={styles.footerButtons}>
                                {Platform.OS !== 'web' && (
                                    <>
                                        <TouchableOpacity style={[styles.button, styles.clearButton]} onPress={handleClear}>
                                            <Text style={styles.buttonText}>Borrar</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity style={[styles.button, styles.saveButton]} onPress={handleConfirm}>
                                            <Text style={styles.buttonText}>Aceptar</Text>
                                        </TouchableOpacity>
                                    </>
                                )}
                                <TouchableOpacity style={[styles.button, { backgroundColor: '#666' }]} onPress={() => setActiveSigner(null)}>
                                    <Text style={styles.buttonText}>Cancelar</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </Modal>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 50,
        paddingBottom: 15,
        backgroundColor: '#f8f9fa',
        borderBottomWidth: 1,
        borderBottomColor: '#dee2e6',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    closeButton: {
        padding: 5,
    },
    contractContainer: {
        flex: 1,
        backgroundColor: '#f9f9f9',
    },
    contractContent: {
        padding: 20,
        paddingBottom: 40,
    },
    contractText: {
        fontSize: 14,
        lineHeight: 20,
        color: '#444',
        textAlign: 'justify',
        marginBottom: 10,
    },
    sectionDivider: {
        height: 1,
        backgroundColor: '#ddd',
        marginVertical: 15,
    },
    signatureRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 30,
        paddingHorizontal: 10,
        gap: 20,
    },
    signatureBox: {
        flex: 1,
        alignItems: 'center',
    },
    signatureLabel: {
        fontSize: 12,
        fontWeight: 'bold',
        marginBottom: 10,
        textAlign: 'center',
    },
    signatureTouchArea: {
        width: '100%',
        height: 100,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        marginBottom: 5,
    },
    signatureImage: {
        width: '100%',
        height: '100%',
    },
    placeholderBox: {
        alignItems: 'center',
        opacity: 0.6,
    },
    placeholderText: {
        fontSize: 12,
        color: '#007bff',
        marginTop: 5,
    },
    signatureLine: {
        width: '100%',
        height: 1,
        backgroundColor: '#000',
        marginTop: 5,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        padding: 20,
    },
    signatureModalContent: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 20,
        height: height * 0.6,
        elevation: 5,
    },
    signingTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 20,
        textAlign: 'center',
    },
    canvasContainer: {
        flex: 1,
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 8,
        overflow: 'hidden',
        marginBottom: 15,
    },
    footerButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 10,
    },
    mainFooter: {
        padding: 20,
        borderTopWidth: 1,
        borderTopColor: '#eee',
        backgroundColor: '#fff',
    },
    button: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    clearButton: {
        backgroundColor: '#6c757d',
    },
    saveButton: {
        backgroundColor: '#28a745',
    },
    disabledButton: {
        backgroundColor: '#ccc',
    },
    buttonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 14, // Slightly smaller to fit 3 buttons if needed
    },
});

export default SignatureModal;
