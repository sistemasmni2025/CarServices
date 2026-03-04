import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, TouchableOpacity, Platform, ActivityIndicator } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { AuthContext } from '../../context/AuthContext';
import { getAsesores } from '../../services/asesores';

// TimePicker Component
const TimePickerRow = ({ label, timeValue, onTimeChange, minTime, disabled }) => {
    // Helper to parse "1:51 PM" into parts
    const parseTime = (timeStr) => {
        if (!timeStr) return { hour: '1', minute: '00', period: 'PM' };
        // Simple parser assuming "H:MM A" format
        const [time, period] = (timeStr || "1:00 PM").split(' ');
        const [hour, minute] = time.split(':');
        return { hour, minute, period };
    };

    const [selected, setSelected] = useState(parseTime(timeValue));

    useEffect(() => {
        setSelected(parseTime(timeValue));
    }, [timeValue]);

    useEffect(() => {
        if (!disabled) {
            onTimeChange(`${selected.hour}:${selected.minute} ${selected.period}`);
        }
    }, [selected]);


    // Validation Filters
    const periods = ['AM', 'PM'];
    let allowedPeriods = periods;
    let allowedHours = Array.from({ length: 12 }, (_, i) => (i + 1).toString());
    let allowedMinutes = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0'));

    if (minTime && !disabled) {
        const minH24 = minTime.getHours();
        const minPeriod = minH24 >= 12 ? 'PM' : 'AM';

        if (minPeriod === 'PM') allowedPeriods = ['PM'];
        const minHour12 = minH24 % 12 || 12;

        if (selected.period === minPeriod) {
            allowedHours = allowedHours.filter(h => {
                let hNum = parseInt(h);
                let minNum = minHour12;
                if (hNum === 12 && minNum !== 12) return false;
                if (hNum === 12) hNum = 0;
                if (minNum === 12) minNum = 0;
                return hNum >= minNum;
            });
        }
    }

    if (disabled) {
        return (
            <View style={[styles.fieldContainer, { opacity: 0.7 }]}>
                <Text style={styles.label}>{label}</Text>
                <View style={[styles.unifiedPickerContainer, { backgroundColor: '#e0e0e0', justifyContent: 'center', paddingHorizontal: 15 }]}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <MaterialCommunityIcons name="lock" size={16} color="#666" style={{ marginRight: 5 }} />
                        <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#555' }}>{timeValue}</Text>
                    </View>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.fieldContainer}>
            <Text style={styles.label}>{label}</Text>
            <View style={styles.unifiedPickerContainer}>
                <View style={styles.pickerSegmentWithBorder}>
                    <Picker
                        selectedValue={selected.hour}
                        style={styles.pickerTransparent}
                        onValueChange={(v) => setSelected({ ...selected, hour: v })}
                    >
                        {allowedHours.map(h => <Picker.Item key={h} label={h} value={h} />)}
                    </Picker>
                </View>
                {/* No Text Separator, Border handles it */}
                <View style={styles.pickerSegmentWithBorder}>
                    <Picker
                        selectedValue={selected.minute}
                        style={styles.pickerTransparent}
                        onValueChange={(v) => setSelected({ ...selected, minute: v })}
                    >
                        {allowedMinutes.map(m => <Picker.Item key={m} label={m} value={m} />)}
                    </Picker>
                </View>
                <View style={styles.pickerSegment}>
                    <Picker
                        selectedValue={selected.period}
                        style={styles.pickerTransparent}
                        onValueChange={(v) => setSelected({ ...selected, period: v })}
                    >
                        {allowedPeriods.map(p => <Picker.Item key={p} label={p} value={p} />)}
                    </Picker>
                </View>
            </View>
        </View>
    );
};

// WebDatePicker - Unified Look with Dividers
const WebDatePicker = ({ dateValue, onDateChange, minDate }) => {
    const now = new Date();
    const effectiveMinDate = minDate || now;

    const getParts = (dStr) => {
        if (!dStr) return { d: now.getDate(), m: now.getMonth() + 1, y: now.getFullYear() };
        const [d, m, y] = dStr.split('/');
        return { d: parseInt(d, 10), m: parseInt(m, 10), y: parseInt(y, 10) };
    };

    const { d: selDay, m: selMonth, y: selYear } = getParts(dateValue);
    const minYear = effectiveMinDate.getFullYear();
    const years = Array.from({ length: 11 }, (_, i) => (minYear + i).toString());

    const minMonth = effectiveMinDate.getMonth() + 1;
    const isMinYear = selYear === minYear;

    const monthNames = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
    const allMonths = Array.from({ length: 12 }, (_, i) => (i + 1).toString().padStart(2, '0'));

    const availableMonths = allMonths.filter(m => {
        if (!isMinYear) return true;
        return parseInt(m, 10) >= minMonth;
    });

    const minDay = effectiveMinDate.getDate();
    const isMinMonth = isMinYear && (selMonth === minMonth);

    const getDaysInMonth = (m, y) => new Date(y, m, 0).getDate();
    const maxDays = getDaysInMonth(selMonth, selYear);
    const allDays = Array.from({ length: maxDays }, (_, i) => (i + 1).toString().padStart(2, '0'));

    const availableDays = allDays.filter(d => {
        if (!isMinMonth) return true;
        return parseInt(d, 10) >= minDay;
    });

    useEffect(() => {
        let needsUpdate = false;
        let newD = selDay;
        let newM = selMonth;
        let newY = selYear;

        if (selYear < minYear) { newY = minYear; needsUpdate = true; }
        const currentIsMinYear = newY === minYear;
        if (currentIsMinYear && selMonth < minMonth) { newM = minMonth; needsUpdate = true; }
        const currentIsMinMonth = currentIsMinYear && (newM === minMonth);
        const currentMaxDays = getDaysInMonth(newM, newY);
        if (newD > currentMaxDays) { newD = currentMaxDays; needsUpdate = true; }
        if (currentIsMinMonth && newD < minDay) { newD = minDay; needsUpdate = true; }

        if (needsUpdate) {
            const dStr = newD.toString().padStart(2, '0');
            const mStr = newM.toString().padStart(2, '0');
            const yStr = newY.toString();
            onDateChange(`${dStr}/${mStr}/${yStr}`);
        }
    }, [selDay, selMonth, selYear, minYear, minMonth, minDay]);

    const updateDate = (d, m, y) => {
        onDateChange(`${d}/${m}/${y}`);
    };

    return (
        <View style={styles.unifiedPickerContainer}>
            {/* Day */}
            <View style={[styles.pickerSegmentWithBorder, { flex: 0.8 }]}>
                <Picker
                    selectedValue={selDay.toString().padStart(2, '0')}
                    style={styles.pickerTransparent}
                    onValueChange={(v) => updateDate(v, selMonth.toString().padStart(2, '0'), selYear.toString())}
                >
                    {availableDays.map(d => <Picker.Item key={d} label={d.toString()} value={d.toString()} />)}
                </Picker>
            </View>
            {/* Month */}
            <View style={[styles.pickerSegmentWithBorder, { flex: 1.2 }]}>
                <Picker
                    selectedValue={selMonth.toString().padStart(2, '0')}
                    style={styles.pickerTransparent}
                    onValueChange={(v) => updateDate(selDay.toString().padStart(2, '0'), v, selYear.toString())}
                >
                    {availableMonths.map(m => {
                        const idx = parseInt(m, 10) - 1;
                        return <Picker.Item key={m} label={monthNames[idx]} value={m} />;
                    })}
                </Picker>
            </View>
            {/* Year */}
            <View style={[styles.pickerSegment, { flex: 1.3 }]}>
                <Picker
                    selectedValue={selYear.toString()}
                    style={styles.pickerTransparent}
                    onValueChange={(v) => updateDate(selDay.toString().padStart(2, '0'), selMonth.toString().padStart(2, '0'), v)}
                >
                    {years.map(y => <Picker.Item key={y} label={y} value={y} />)}
                </Picker>
            </View>
        </View>
    );
};

// DatePickerWrapper
const DatePickerFieldPoly = ({ label, dateValue, onDateChange, minimumDate, disabled }) => {
    const [showPicker, setShowPicker] = useState(false);

    // Parse date string DD/MM/YYYY to Date object
    const parseDate = (dateStr) => {
        if (!dateStr) return new Date();
        const parts = dateStr.split('/');
        if (parts.length === 3) {
            return new Date(parts[2], parts[1] - 1, parts[0]);
        }
        return new Date();
    };

    const [date, setDate] = useState(parseDate(dateValue));

    useEffect(() => {
        setDate(parseDate(dateValue));
    }, [dateValue]);

    const onChange = (event, selectedDate) => {
        const currentDate = selectedDate || date;
        setShowPicker(Platform.OS === 'ios');
        setDate(currentDate);
        const day = currentDate.getDate().toString().padStart(2, '0');
        const month = (currentDate.getMonth() + 1).toString().padStart(2, '0');
        const year = currentDate.getFullYear();
        onDateChange(`${day}/${month}/${year}`);
    };

    if (disabled) {
        return (
            <View style={[styles.fieldContainer, { opacity: 0.7 }]}>
                <Text style={styles.label}>{label}</Text>
                <View style={[styles.unifiedPickerContainer, { backgroundColor: '#e0e0e0', paddingHorizontal: 15, justifyContent: 'center' }]}>
                    <Text style={{ fontSize: 14, color: '#333' }}>{dateValue}</Text>
                </View>
            </View>
        );
    }

    if (Platform.OS === 'web') {
        return (
            <View style={styles.fieldContainer}>
                <Text style={styles.label}>{label}</Text>
                <WebDatePicker
                    dateValue={dateValue}
                    onDateChange={onDateChange}
                    minDate={minimumDate}
                />
            </View>
        );
    }

    return (
        <View style={styles.fieldContainer}>
            <Text style={styles.label}>{label}</Text>
            <TouchableOpacity onPress={() => setShowPicker(true)} style={styles.unifiedPickerContainer}>
                <Text style={{ fontSize: 14, color: '#333', marginLeft: 10 }}>{dateValue}</Text>
                <MaterialCommunityIcons name="calendar" size={20} color="#666" style={{ marginRight: 10 }} />
            </TouchableOpacity>
            {showPicker && (
                <DateTimePicker
                    value={date}
                    mode="date"
                    display="default"
                    onChange={onChange}
                    minimumDate={minimumDate}
                />
            )}
        </View>
    );
};


const IngresoScreen = ({ data, onUpdate, onNext }) => {
    const { userData } = useContext(AuthContext);
    const [asesoresList, setAsesoresList] = useState([]);
    const [loadingAsesores, setLoadingAsesores] = useState(false);

    const formatDate = (date) => {
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    };

    const formatTime = (date) => {
        let hours = date.getHours();
        const minutes = date.getMinutes().toString().padStart(2, '0');
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        hours = hours ? hours : 12;
        return `${hours}:${minutes} ${ampm}`;
    };

    const [form, setForm] = useState(data || {});

    const updateForm = (updates) => {
        const newForm = { ...form, ...updates };
        setForm(newForm);
        onUpdate(newForm);
    };

    useEffect(() => {
        setForm(data);
    }, [data]);

    useEffect(() => {
        // Enforce data linkage
        if (userData) {
            if (userData.usuarioclavepiso) {
                // User has fixed floor advisor ID assigned
                if (!form.asesor || !form.asesorId) {
                    setForm(prev => ({
                        ...prev,
                        asesorId: userData.usuarioclavepiso,
                        asesor: `${userData.nombre} ${userData.apellido}`
                    }));
                }
            } else {
                // User doesn't have a specific floor advisor assigned. We must fetch the list.
                if (asesoresList.length === 0 && !loadingAsesores) {
                    const fetchList = async () => {
                        setLoadingAsesores(true);
                        try {
                            const list = await getAsesores();
                            setAsesoresList(list || []);
                            // Remove auto-select first in list
                            if (!form.asesorId && !form.asesor && userData?.usuarioclavepiso) {
                                // Fallback just in case
                            }
                        } catch (err) {
                            console.error("Failed to fetch asesores", err);
                        } finally {
                            setLoadingAsesores(false);
                        }
                    };
                    fetchList();
                }
            }
        }
    }, [userData, form.asesor, form.asesorId, asesoresList.length]);


    const handleNext = () => {
        onUpdate(form);
        onNext();
    };

    const minDate = new Date();


    // Calculate minEntregaTime
    let minEntregaTime = null;
    if (form.fecha && form.fechaEntrega && form.horaIngreso) {
        const parseDateSimple = (dStr) => {
            const [d, m, y] = dStr.split('/');
            return new Date(y, m - 1, d);
        };

        const dIngreso = parseDateSimple(form.fecha);
        const dEntrega = parseDateSimple(form.fechaEntrega);

        // If same day, restrict time
        if (dIngreso.getTime() === dEntrega.getTime()) {
            try {
                // Parse time string "H:MM PM" to Date
                const parts = (form.horaIngreso || "").split(' ');
                if (parts.length === 2) {
                    const [timePart, period] = parts;
                    const timeParts = timePart.split(':');

                    if (timeParts.length === 2) {
                        const [hours, minutes] = timeParts;
                        let h = parseInt(hours);
                        if (!isNaN(h)) {
                            if (period === 'PM' && h !== 12) h += 12;
                            if (period === 'AM' && h === 12) h = 0;

                            minEntregaTime = new Date();
                            minEntregaTime.setHours(h);
                            minEntregaTime.setMinutes(parseInt(minutes) || 0);
                        }
                    }
                }
            } catch (err) {
                console.log("Error calculating min time", err);
            }
        }
    }

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
            <View style={styles.headerRow}>
                <Text style={styles.sectionTitle}>Resumen de Orden</Text>
                <View style={styles.statusBadge}>
                    <Text style={styles.statusText}>En Proceso</Text>
                </View>
            </View>

            <View style={styles.card}>
                <View style={styles.row}>
                    <View style={[styles.fieldContainer, { flex: 1 }]}>
                        <DatePickerFieldPoly
                            label="Fecha"
                            dateValue={form.fecha}
                            onDateChange={(val) => updateForm({ fecha: val })}
                            disabled={true}
                        />
                    </View>
                </View>

                <View style={styles.row}>
                    <View style={[styles.fieldContainer, { flex: 1 }]}>
                        <Text style={styles.label}>Tipo Orden</Text>
                        <TextInput
                            style={styles.input}
                            value={form.tipoOrden || "Venta"}
                            onChangeText={(val) => updateForm({ tipoOrden: val })}
                            editable={false}
                        />
                    </View>
                </View>

                <View style={styles.row}>
                    <View style={[styles.fieldContainer, { flex: 1 }]}>
                        <Text style={styles.label}>Servicio Foráneo</Text>
                        <TextInput
                            style={styles.input}
                            value={form.servicioForaneo || "Ninguno"}
                            onChangeText={(val) => updateForm({ servicioForaneo: val })}
                            editable={false}
                        />
                    </View>
                </View>
            </View>

            <Text style={styles.sectionTitle}>Asignación de Personal</Text>
            <View style={styles.card}>
                <View style={styles.fieldContainer}>
                    <Text style={styles.label}>Unidad de Negocio</Text>
                    <TextInput style={styles.input} value={form.unidadNegocio} editable={false} />
                </View>

                <View style={[styles.fieldContainer, { marginTop: 15 }]}>
                    <Text style={styles.label}>Asesor de Piso</Text>
                    <View style={[styles.unifiedPickerContainer, userData?.usuarioclavepiso ? { backgroundColor: '#e0e0e0' } : {}]}>
                        {loadingAsesores ? (
                            <ActivityIndicator size="small" color="#007bff" style={{ marginLeft: 15 }} />
                        ) : (
                            <Picker
                                selectedValue={form.asesorId}
                                style={[styles.pickerTransparent, userData?.usuarioclavepiso ? { color: '#555' } : {}]}
                                enabled={!userData?.usuarioclavepiso}
                                onValueChange={(itemValue) => {
                                    // Find name string-safe
                                    const selectedAsesor = asesoresList.find(a => a.apisocve.toString() === (itemValue || "").toString());
                                    updateForm({
                                        asesorId: itemValue,
                                        asesor: selectedAsesor ? selectedAsesor.apisonom : form.asesor
                                    });
                                }}
                            >
                                {userData?.usuarioclavepiso ? (
                                    <Picker.Item
                                        label={`${userData.nombre} ${userData.apellido}`}
                                        value={userData.usuarioclavepiso}
                                    />
                                ) : (
                                    <>
                                        <Picker.Item key="unselected" label="Seleccione" value="" />
                                        {asesoresList.map(asesor => (
                                            <Picker.Item
                                                key={asesor.apisocve.toString()}
                                                label={asesor.apisonom}
                                                value={asesor.apisocve}
                                            />
                                        ))}
                                    </>
                                )}
                            </Picker>
                        )}
                    </View>
                </View>
            </View>

            <Text style={styles.sectionTitle}>Tiempos Estimados</Text>
            <View style={styles.card}>
                <View style={styles.row}>
                    <View style={{ flex: 1, marginRight: 10 }}>
                        <DatePickerFieldPoly
                            label="Fecha Ingreso"
                            dateValue={form.fecha}
                            disabled={true}
                            onDateChange={(val) => updateForm({ fecha: val })}
                        />
                        <View style={{ height: 10 }} />
                        <TimePickerRow
                            label="Hora Ingreso"
                            timeValue={form.horaIngreso}
                            disabled={true}
                            onTimeChange={(val) => updateForm({ horaIngreso: val })}
                        />
                    </View>
                    <View style={{ flex: 1 }}>
                        <DatePickerFieldPoly
                            label="Fecha Entrega"
                            dateValue={form.fechaEntrega}
                            onDateChange={(val) => updateForm({ fechaEntrega: val })}
                            minimumDate={minDate}
                            disabled={false}
                        />
                        <View style={{ height: 10 }} />
                        <TimePickerRow
                            label="Hora Entrega"
                            timeValue={form.horaEntrega}
                            onTimeChange={(val) => updateForm({ horaEntrega: val })}
                            disabled={false}
                            minTime={minEntregaTime}
                        />
                    </View>
                </View>
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 20 }}>
                <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
                    <Text style={styles.nextButtonText}>Next</Text>
                    <MaterialCommunityIcons name="arrow-right" size={20} color="#fff" />
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f7fa',
    },
    contentContainer: {
        padding: 20,
        paddingBottom: 40,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 10,
        marginTop: 10,
    },
    statusBadge: {
        backgroundColor: '#e3f2fd',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#90caf9',
    },
    statusText: {
        color: '#1976d2',
        fontWeight: 'bold',
        fontSize: 12,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 10,
        padding: 15,
        marginBottom: 20,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    row: {
        flexDirection: 'row',
        marginBottom: 15,
    },
    fieldContainer: {
        marginBottom: 5,
    },
    label: {
        fontSize: 12,
        color: '#666',
        marginBottom: 5,
        fontWeight: '600',
        textTransform: 'uppercase',
    },
    input: {
        backgroundColor: '#f9f9f9',
        borderWidth: 1,
        borderColor: '#e0e0e0',
        borderRadius: 25,
        paddingVertical: 12,
        paddingHorizontal: 15,
        fontSize: 14,
        color: '#333',
    },
    unifiedPickerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f9f9f9',
        borderWidth: 1,
        borderColor: '#e0e0e0',
        borderRadius: 25,
        overflow: 'hidden',
        height: 50,
    },
    pickerTransparent: {
        height: 50,
        width: '100%',
        color: '#333',
        backgroundColor: 'transparent',
        borderWidth: 0,
        outlineStyle: 'none',
    },
    pickerSegment: {
        flex: 1,
        height: 50,
        justifyContent: 'center',
        // No border
    },
    pickerSegmentWithBorder: {
        flex: 1,
        height: 50,
        justifyContent: 'center',
        borderRightWidth: 1, // Divider
        borderRightColor: '#d0d0d0', // Slightly darker than container border
    },
    nextButton: {
        backgroundColor: '#007bff',
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 25,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
    },
    nextButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
        marginRight: 8,
    },
});

export default IngresoScreen;
