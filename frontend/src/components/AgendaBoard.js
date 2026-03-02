import React, { useState, useEffect, useRef, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, Modal } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');
const CELL_WIDTH = 120;
const LEFT_PANEL_WIDTH = 150;

/**
 * Genera un arreglo continuo de días (30 antes y 30 después de hoy).
 */
const generateDays = () => {
    const days = [];
    const today = new Date();
    // -30 a +30 días para scroll continuo (total 61 días)
    for (let i = -30; i <= 30; i++) {
        const d = new Date(today);
        d.setDate(today.getDate() + i);
        const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
        const monthName = monthNames[d.getMonth()];
        const dayNames = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
        const dayName = dayNames[d.getDay()];
        const dayNumber = d.getDate().toString().padStart(2, '0');

        days.push({
            id: `day_${i}`,
            monthText: monthName,
            dayText: `${dayName} ${dayNumber}`,
            isToday: i === 0,
            dateObj: d,
            dayIndex: i + 30 // Indice consecutivo de 0 a 60 (hoy = 30)
        });
    }
    return days;
};

const AgendaBoard = () => {
    const ALL_DAYS = useMemo(() => generateDays(), []);
    const TODAY_INDEX = 30; // El índice 30 corresponde a hoy

    // ESTA VARIABLE ES LA QUE DEBERÁS REEMPLAZAR CON TU API BACKEND POSTERIORMENTE
    const MOCK_DATA = {
        resources: [
            {
                id: 1, name: "Juan Miguel Castillo", avatar: "account",
                events: [
                    { id: 101, title: "Reparación de iluminación", dayIndex: TODAY_INDEX, duration: 1, color: "#4CAF50", status: "Abierta", time: "08:00 - 12:00", orderNumber: "ORD-0010", plates: "ABC-123" },
                    { id: 102, title: "Montaje de aire", dayIndex: TODAY_INDEX + 1, duration: 1, color: "#FF9800", status: "Abierta", time: "10:00 - 14:00", orderNumber: "ORD-0012", plates: "XYZ-987" }
                ]
            },
            {
                id: 2, name: "Patricio Sepúlveda", avatar: "account-tie",
                events: [
                    { id: 103, title: "Avería de frenos", dayIndex: TODAY_INDEX - 1, duration: 1, color: "#673AB7", status: "En Proceso", time: "09:00 - 13:00", orderNumber: "ORD-0015", plates: "LMN-456" },
                    { id: 104, title: "Ajuste de motor", dayIndex: TODAY_INDEX, duration: 1, color: "#3F51B5", status: "Pendiente", time: "08:00 - 18:00", orderNumber: "ORD-0018", plates: "DEF-001" },
                    { id: 105, title: "Reparación sistema CD", dayIndex: TODAY_INDEX + 2, duration: 2, color: "#9C27B0", status: "Abierta", time: "08:00 - 18:00", orderNumber: "ORD-0022", plates: "GHI-222" },
                ]
            },
            {
                id: 3, name: "Emilio Milans", avatar: "account-hard-hat",
                events: [
                    { id: 106, title: "Instalación de red", dayIndex: TODAY_INDEX - 2, duration: 4, color: "#F57C00", status: "En Proceso", time: "Toda la jornada", orderNumber: "ORD-0030", plates: "JKL-333" }
                ]
            },
            {
                id: 4, name: "Jaime Baeza", avatar: "account",
                events: [
                    { id: 107, title: "Luces del baño", dayIndex: TODAY_INDEX, duration: 1, color: "#4CAF50", status: "Cerrada", time: "15:00 - 17:00", orderNumber: "ORD-0041", plates: "MNO-444" },
                    { id: 108, title: "Inventario Almacén", dayIndex: TODAY_INDEX + 3, duration: 3, color: "#0288D1", status: "Pendiente", time: "09:00 - 18:00", orderNumber: "ORD-0042", plates: "PQR-555" }
                ]
            }
        ]
    };

    const [selectedEvent, setSelectedEvent] = useState(null);
    const [isDatePickerVisible, setDatePickerVisible] = useState(false);

    // Rango de fechas seleccionadas para el filtro
    const [selectedStartDate, setSelectedStartDate] = useState(null);
    const [selectedEndDate, setSelectedEndDate] = useState(null);

    // Variables temporales mientras el modal está abierto eligiendo
    const [tempStartDate, setTempStartDate] = useState(null);
    const [tempEndDate, setTempEndDate] = useState(null);

    const [pickerMonthOffset, setPickerMonthOffset] = useState(0);
    const [filterPreset, setFilterPreset] = useState('Personalizado');
    const scrollRef = useRef(null);

    // Días a mostrar en el calendario interactivo principal
    const DISPLAY_DAYS = useMemo(() => {
        if (!selectedStartDate) {
            // Vista por defecto: Solo el día 1 al último día del mes actual
            const today = new Date();
            const currentMonth = today.getMonth();
            const currentYear = today.getFullYear();
            return ALL_DAYS.filter(d => d.dateObj.getMonth() === currentMonth && d.dateObj.getFullYear() === currentYear);
        }

        const startIdx = selectedStartDate.dayIndex;
        const endIdx = selectedEndDate ? selectedEndDate.dayIndex : startIdx;

        const trueStart = Math.min(startIdx, endIdx);
        const trueEnd = Math.max(startIdx, endIdx);

        return ALL_DAYS.filter(d => d.dayIndex >= trueStart && d.dayIndex <= trueEnd);
    }, [selectedStartDate, selectedEndDate, ALL_DAYS]);

    // Auto-preparar modal al abrir
    useEffect(() => {
        if (isDatePickerVisible) {
            setTempStartDate(selectedStartDate);
            setTempEndDate(selectedEndDate);
        }
    }, [isDatePickerVisible]);

    const selectPreset = (presetName) => {
        setFilterPreset(presetName);
        const today = new Date();
        let targetStart = new Date(today);
        let targetEnd = new Date(today);

        if (presetName === 'Hoy') {
            // Already today
        } else if (presetName === 'Ayer') {
            targetStart.setDate(today.getDate() - 1);
            targetEnd.setDate(today.getDate() - 1);
        } else if (presetName === 'Mañana') {
            targetStart.setDate(today.getDate() + 1);
            targetEnd.setDate(today.getDate() + 1);
        } else {
            // 'Personalizado'
            // Solo reseteamos la temporal, no cerramos modal
            setTempStartDate(null);
            setTempEndDate(null);
            return;
        }

        const sDay = ALL_DAYS.find(d => d.dateObj.toDateString() === targetStart.toDateString());
        const eDay = ALL_DAYS.find(d => d.dateObj.toDateString() === targetEnd.toDateString());

        if (sDay && eDay) {
            setSelectedStartDate(sDay);
            setSelectedEndDate(eDay);
            setDatePickerVisible(false);
            setPickerMonthOffset(0);
        }
    };

    const scrollToDayIndex = (index) => {
        if (scrollRef.current && !selectedStartDate) { // Solo scroll automático en modo continuo
            let targetX = (index * CELL_WIDTH) - 20;
            if (targetX < 0) targetX = 0;
            scrollRef.current.scrollTo({ x: targetX, animated: true });
        }
    };

    const isSingleDayView = !!selectedStartDate && selectedStartDate === selectedEndDate;
    const isRangeView = !!selectedStartDate;

    // Si tenemos de 1 a 3 días se puede expandir dinámicamente, sino usamos el cell width default
    const getDynamicCellWidth = () => {
        if (!isRangeView) return CELL_WIDTH;
        const visibleCount = DISPLAY_DAYS.length;
        if (visibleCount <= 3) {
            return (width - LEFT_PANEL_WIDTH) / visibleCount;
        }
        return CELL_WIDTH;
    };

    const dynamicCellWidth = getDynamicCellWidth();

    // Filter resources when there is a selected date range
    const DISPLAY_RESOURCES = useMemo(() => {
        if (!isRangeView) return MOCK_DATA.resources;

        return MOCK_DATA.resources.filter(res => {
            return res.events.some(ev => {
                const eventStart = ev.dayIndex;
                const eventEnd = ev.dayIndex + ev.duration - 1; // Usar idices inclusivos

                const filterStart = DISPLAY_DAYS[0].dayIndex;
                const filterEnd = DISPLAY_DAYS[DISPLAY_DAYS.length - 1].dayIndex;

                // Verificamos si hay alguna superposición
                return eventStart <= filterEnd && eventEnd >= filterStart;
            });
        });
    }, [isRangeView, DISPLAY_DAYS]);

    // Efecto para auto-scroll según el estado
    useEffect(() => {
        if (isRangeView && scrollRef.current) {
            // Regresamos el scroll horizontal a 0 inicio del rango
            setTimeout(() => {
                scrollRef.current.scrollTo({ x: 0, animated: false });
            }, 50);
        } else if (!isRangeView && scrollRef.current) {
            // Cuando es el mes por default, centramos en hoy (si está dentro del rango mostrado)
            setTimeout(() => {
                const todayCurrentDisplayIndex = DISPLAY_DAYS.findIndex(d => d.isToday);
                if (todayCurrentDisplayIndex !== -1) {
                    let targetX = (todayCurrentDisplayIndex * CELL_WIDTH) - 20;
                    if (targetX < 0) targetX = 0;
                    scrollRef.current.scrollTo({ x: targetX, animated: true });
                }
            }, 50);
        }
    }, [isRangeView, DISPLAY_DAYS]);

    // Generador de datos del calendario (cuadrícula mensual)
    const getMonthData = (offset) => {
        const d = new Date();
        d.setMonth(d.getMonth() + offset);
        const year = d.getFullYear();
        const month = d.getMonth();
        const firstDay = new Date(year, month, 1).getDay(); // 0 is Sunday
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

        const grid = [];
        let currentWeek = [];
        for (let i = 0; i < firstDay; i++) currentWeek.push(null);

        for (let i = 1; i <= daysInMonth; i++) {
            currentWeek.push(new Date(year, month, i));
            if (currentWeek.length === 7) {
                grid.push(currentWeek);
                currentWeek = [];
            }
        }
        if (currentWeek.length > 0) {
            while (currentWeek.length < 7) currentWeek.push(null);
            grid.push(currentWeek);
        }
        return { name: `${monthNames[month]} ${year}`, grid };
    };

    const currentMonthData = getMonthData(pickerMonthOffset);

    const handleDayTapPicker = (dateObj) => {
        if (!dateObj) return;
        const targetDay = ALL_DAYS.find(d => d.dateObj.toDateString() === dateObj.toDateString());
        if (!targetDay) {
            alert('Solo se pueden seleccionar fechas dentro del rango permitido (±30 días desde hoy).');
            return;
        }

        setFilterPreset('Personalizado');

        if (!tempStartDate || (tempStartDate && tempEndDate)) {
            // Empezar nuevo rango
            setTempStartDate(targetDay);
            setTempEndDate(null);
        } else if (tempStartDate && !tempEndDate) {
            // Completar rango
            if (targetDay.dayIndex < tempStartDate.dayIndex) {
                setTempEndDate(tempStartDate);
                setTempStartDate(targetDay);
            } else {
                setTempEndDate(targetDay);
            }
        }
    };

    const applyCustomRange = () => {
        if (tempStartDate) {
            setSelectedStartDate(tempStartDate);
            setSelectedEndDate(tempEndDate || tempStartDate); // Si no se eligió fin, es 1 solo día
            setDatePickerVisible(false);
            setPickerMonthOffset(0);
        } else {
            alert('Por favor selecciona al menos una fecha inicial.');
        }
    };

    const clearFilters = () => {
        setSelectedStartDate(null);
        setSelectedEndDate(null);
        setTempStartDate(null);
        setTempEndDate(null);
        setFilterPreset('Personalizado');
    };

    const EventBlock = ({ event, customWidth }) => (
        <TouchableOpacity
            style={[
                styles.eventBlock,
                {
                    backgroundColor: event.color,
                    width: customWidth,
                }
            ]}
            onPress={() => setSelectedEvent(event)}
        >
            <View style={styles.eventHeader}>
                <MaterialCommunityIcons name="tools" size={14} color="#fff" />
                <Text style={styles.eventTitle} numberOfLines={2}> {event.title}</Text>
            </View>
            <View style={styles.eventFooter}>
                <MaterialCommunityIcons name="car" size={12} color="rgba(255,255,255,0.9)" />
                <Text style={styles.eventSub} numberOfLines={1}>{event.plates}</Text>
            </View>
        </TouchableOpacity>
    );

    const BottomPanel = () => {
        if (!selectedEvent) {
            return (
                <View style={[styles.bottomPanel, styles.bottomPanelEmpty]}>
                    <MaterialCommunityIcons name="gesture-tap" size={30} color="#CCC" />
                    <Text style={styles.emptyPanelText}>Toque una actividad programada arriba para visualizar sus detalles de OT aquí .</Text>
                </View>
            );
        }

        return (
            <View style={styles.bottomPanel}>
                <View style={styles.panelHeader}>
                    <Text style={styles.panelTitle}>Detalle(s): {selectedEvent.title}</Text>
                    <TouchableOpacity onPress={() => setSelectedEvent(null)}>
                        <MaterialCommunityIcons name="close" size={20} color="#666" />
                    </TouchableOpacity>
                </View>

                <View style={styles.panelContentRow}>
                    <View style={styles.detailCol}>
                        <View style={styles.statusBadge}>
                            <Text style={styles.statusText}>{selectedEvent.status}</Text>
                        </View>
                        <View style={styles.detailSection}>
                            <Text style={styles.detailLabel}>Código de Orden</Text>
                            <Text style={styles.detailValue}>{selectedEvent.orderNumber}</Text>
                        </View>
                    </View>

                    <View style={styles.detailCol}>
                        <View style={styles.detailSection}>
                            <Text style={styles.detailLabel}>Horario / Fecha</Text>
                            <Text style={styles.detailValue}>{selectedEvent.time}</Text>
                        </View>
                    </View>

                    <View style={styles.detailColLarge}>
                        <View style={styles.detailSection}>
                            <Text style={styles.detailLabel}>Trabajo a realizar</Text>
                            <Text style={styles.detailValue} numberOfLines={3}>
                                (Información extendida sobre {selectedEvent.title}. Esta sección será retroalimentada asíncronamente cuando interactúe con el backend principal.)
                            </Text>
                        </View>
                    </View>
                </View>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            {/* Barra de Filtro de Fechas MUY VISIBLE */}
            <View style={styles.filterBar}>
                <View style={styles.filterLeft}>
                    <View style={styles.iconCircle}>
                        <MaterialCommunityIcons name="calendar-search" size={24} color="#FFF" />
                    </View>
                    <View style={styles.filterTextGroup}>
                        <Text style={styles.filterTitle}>Filtrar Fecha</Text>
                        <Text style={styles.filterText}>
                            {isRangeView
                                ? (selectedStartDate === selectedEndDate
                                    ? `Filtrado al: ${selectedStartDate.dayText} de ${selectedStartDate.monthText}`
                                    : `Rango: ${selectedStartDate.dayText} de ${selectedStartDate.monthText} - ${selectedEndDate.dayText} de ${selectedEndDate.monthText}`)
                                : 'Vista Mensual (Mes Actual)'}
                        </Text>
                    </View>
                </View>

                {isRangeView ? (
                    <TouchableOpacity style={[styles.filterButtonPrimary, { backgroundColor: '#DC3545' }]} onPress={clearFilters}>
                        <MaterialCommunityIcons name="filter-remove" size={18} color="#FFF" />
                        <Text style={styles.filterButtonTextPrimary}>Quitar Filtro</Text>
                    </TouchableOpacity>
                ) : (
                    <TouchableOpacity style={styles.filterButtonPrimary} onPress={() => setDatePickerVisible(true)}>
                        <MaterialCommunityIcons name="calendar-edit" size={18} color="#FFF" />
                        <Text style={styles.filterButtonTextPrimary}>Filtrar Fecha</Text>
                    </TouchableOpacity>
                )}
            </View>

            {/* Contenedor principal de la matriz */}
            <View style={styles.calendarArea}>
                <ScrollView vertical showsVerticalScrollIndicator={true} style={styles.verticalScroller}>

                    {/* Estructura Side-by-Side: Nombres a la Izquierda, Grid a la Derecha */}
                    <View style={styles.matrixContainer}>

                        {/* 1. Columna Izquierda: Nombres de los recursos (Estática horizontalmente) */}
                        <View style={styles.leftResourceCol}>
                            {/* Hueco superior para emparejar con la zona de días */}
                            <View style={[styles.headerSpacer]} />

                            {DISPLAY_RESOURCES.length > 0 ? DISPLAY_RESOURCES.map(res => (
                                <View key={res.id} style={styles.resourceIdentity}>
                                    <MaterialCommunityIcons name={res.avatar} size={24} color="#666" style={styles.avatarIcon} />
                                    <Text style={styles.resourceName} numberOfLines={2}>{res.name}</Text>
                                </View>
                            )) : (
                                <View style={styles.emptyResourceIdentity}>
                                    <Text style={styles.emptyResourceText}>Sin actividades</Text>
                                </View>
                            )}
                        </View>

                        {/* 2. Columna Derecha: El calendario y las cuadrículas envueltas juntas (Hacen scroll horizontal sincrónico) */}
                        <ScrollView horizontal showsHorizontalScrollIndicator={true} ref={scrollRef}>
                            <View style={styles.rightGridCol}>

                                {/* A. Fila de Días (Se desliza junto con todo lo de abajo) */}
                                <View style={styles.headerRowDays}>
                                    {DISPLAY_DAYS.map(d => (
                                        <View key={d.id} style={[styles.dayCell, d.isToday && styles.todayHeaderCell, { width: dynamicCellWidth }]}>
                                            <Text style={[styles.monthText, d.isToday && styles.todayHeaderText]}>{d.monthText}</Text>
                                            <Text style={[styles.dayText, d.isToday && styles.todayHeaderText]}>{d.dayText}</Text>
                                        </View>
                                    ))}
                                </View>

                                {/* B. Filas de Eventos y Cuadrícula */}
                                {DISPLAY_RESOURCES.map(res => (
                                    <View key={res.id} style={styles.resourceRowGrid}>

                                        {/* Celdas de cuadrícula (Fondo) */}
                                        <View style={styles.gridBackgroundLayer}>
                                            {DISPLAY_DAYS.map(d => (
                                                <View key={`bg-${d.id}`} style={[styles.timelineBgCell, d.isToday && styles.todayBgCell, { width: dynamicCellWidth }]} />
                                            ))}
                                        </View>

                                        {/* Capa de eventos flotantes */}
                                        {res.events.map(ev => {

                                            // En este nuevo enfoque (DISPLAY_DAYS dinámico) 
                                            // todos los eventos están limitados a este arreglo local
                                            const dIndex = DISPLAY_DAYS.findIndex(d => d.dayIndex === ev.dayIndex);

                                            // Si el evento empieza ANTES del arreglo visible pero termina DENTRO o DESPUÉS,
                                            // le recortaremos la representación visual 
                                            let isVisible = false;
                                            let leftPos = 0;
                                            let visibleDuration = 0;

                                            const evStart = ev.dayIndex;
                                            const evEnd = ev.dayIndex + ev.duration - 1;
                                            const vStart = DISPLAY_DAYS[0].dayIndex;
                                            const vEnd = DISPLAY_DAYS[DISPLAY_DAYS.length - 1].dayIndex;

                                            if (evStart <= vEnd && evEnd >= vStart) {
                                                isVisible = true;

                                                // Si el evento arranca antes de lo que vemos, pega la UI al borde izquierdo (index 0)
                                                // Si arranca dentro, empujalo a su dia corrrespondiente dentro de los mostrados
                                                const renderStartIndex = evStart < vStart ? 0 : DISPLAY_DAYS.findIndex(d => d.dayIndex === evStart);

                                                // Cuantos días del evento son verdaderamente visibles en el rango de búsqueda?
                                                const trueStart = Math.max(evStart, vStart);
                                                const trueEnd = Math.min(evEnd, vEnd);
                                                visibleDuration = (trueEnd - trueStart) + 1;

                                                leftPos = renderStartIndex * dynamicCellWidth;
                                            }

                                            if (!isVisible) return null; // Fuera del filtro
                                            const displayWidth = (dynamicCellWidth * visibleDuration) - 4;

                                            return (
                                                <View
                                                    key={`ev-${ev.id}`}
                                                    style={[styles.eventWrapper, { left: leftPos }]}
                                                >
                                                    <EventBlock event={ev} customWidth={displayWidth} />
                                                </View>
                                            );
                                        })}
                                    </View>
                                ))}

                                {DISPLAY_RESOURCES.length === 0 && (
                                    <View style={styles.emptyGridRow}>
                                        <MaterialCommunityIcons name="calendar-blank-outline" size={40} color="#E0E0E0" />
                                        <Text style={styles.emptyGridText}>No hay órdenes programadas para esta fecha.</Text>
                                    </View>
                                )}
                            </View>
                        </ScrollView>

                    </View>
                </ScrollView>
            </View>

            {/* Panel Inferior (OT Detalle) */}
            <BottomPanel />

            {/* Modal Básico de Selector de Fecha */}
            <Modal
                visible={isDatePickerVisible}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setDatePickerVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>

                        {/* Sidebar de Filtros Rápidos */}
                        <View style={styles.sidebarPanel}>
                            {['Hoy', 'Ayer', 'Mañana', 'Personalizado'].map(preset => (
                                <TouchableOpacity
                                    key={preset}
                                    style={[styles.sidebarBtn, filterPreset === preset && styles.sidebarBtnActive]}
                                    onPress={() => selectPreset(preset)}
                                >
                                    <Text style={[styles.sidebarText, filterPreset === preset && styles.sidebarTextActive]}>
                                        {preset}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        {/* Contenido Principal Modal (Calendario) */}
                        <View style={styles.calendarPanel}>
                            <View style={styles.modalHeader}>
                                <Text style={styles.modalTitle}>Filtrar Fecha</Text>
                                <TouchableOpacity onPress={() => setDatePickerVisible(false)}>
                                    <MaterialCommunityIcons name="close" size={24} color="#666" />
                                </TouchableOpacity>
                            </View>

                            {/* Mini Calendario Header */}
                            <View style={styles.miniCalHeaderRow}>
                                <TouchableOpacity onPress={() => setPickerMonthOffset(prev => prev - 1)} style={styles.miniCalNavBtn}>
                                    <MaterialCommunityIcons name="chevron-left" size={24} color="#007BFF" />
                                </TouchableOpacity>
                                <Text style={styles.miniCalMonthName}>{currentMonthData.name}</Text>
                                <TouchableOpacity onPress={() => setPickerMonthOffset(prev => prev + 1)} style={styles.miniCalNavBtn}>
                                    <MaterialCommunityIcons name="chevron-right" size={24} color="#007BFF" />
                                </TouchableOpacity>
                            </View>

                            {/* Cabecera Días */}
                            <View style={styles.miniCalDaysHeader}>
                                {['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa'].map(dayCode => (
                                    <Text key={dayCode} style={styles.miniCalDayLabel}>{dayCode}</Text>
                                ))}
                            </View>

                            {/* Cuadrícula Fechas */}
                            <View style={styles.miniCalGrid}>
                                {currentMonthData.grid.map((week, wi) => (
                                    <View key={`week-${wi}`} style={styles.miniCalWeekRow}>
                                        {week.map((day, di) => {
                                            if (!day) return <View key={`empty-${di}`} style={styles.miniCalDayCell} />;

                                            // Fechas seleccionables: -30 a +30 de hoy (en ALL_DAYS)
                                            const foundTarget = ALL_DAYS.find(d => d.dateObj.toDateString() === day.toDateString());
                                            const isSelectable = !!foundTarget;

                                            // Rango Lógica
                                            let isStart = false;
                                            let isEnd = false;
                                            let isInRange = false;
                                            let isSingleSelected = false;

                                            if (foundTarget && tempStartDate) {
                                                if (tempEndDate) {
                                                    const tS = Math.min(tempStartDate.dayIndex, tempEndDate.dayIndex);
                                                    const tE = Math.max(tempStartDate.dayIndex, tempEndDate.dayIndex);

                                                    if (foundTarget.dayIndex === tS) isStart = true;
                                                    if (foundTarget.dayIndex === tE) isEnd = true;
                                                    if (foundTarget.dayIndex > tS && foundTarget.dayIndex < tE) isInRange = true;
                                                    if (tS === tE && foundTarget.dayIndex === tS) {
                                                        isStart = false;
                                                        isEnd = false;
                                                        isSingleSelected = true;
                                                    }
                                                } else {
                                                    if (foundTarget.dayIndex === tempStartDate.dayIndex) isSingleSelected = true;
                                                }
                                            }

                                            return (
                                                <TouchableOpacity
                                                    key={`day-${di}`}
                                                    style={[
                                                        styles.miniCalDayCell,
                                                        !isSelectable && styles.miniCalDayDisabled,
                                                        isSingleSelected && styles.miniCalDaySelected,
                                                        isStart && styles.miniCalDayRangeStart, // Mitad de color
                                                        isEnd && styles.miniCalDayRangeEnd, // Mitad alreves
                                                        isInRange && styles.miniCalDayInRange, // Color de caja suave completo
                                                    ]}
                                                    onPress={() => isSelectable && handleDayTapPicker(day)}
                                                    disabled={!isSelectable}
                                                >
                                                    <Text style={[
                                                        styles.miniCalDayText,
                                                        !isSelectable && styles.miniCalDayTextDisabled,
                                                        (isSingleSelected || isStart || isEnd) && styles.miniCalDayTextSelected,
                                                        isInRange && styles.miniCalDayTextInRange
                                                    ]}>
                                                        {day.getDate()}
                                                    </Text>
                                                </TouchableOpacity>
                                            );
                                        })}
                                    </View>
                                ))}
                            </View>

                            {/* Boton Aplicar / Listo Abajo */}
                            <View style={styles.modalFooterActions}>
                                <TouchableOpacity style={styles.applyBtnEmpty} onPress={clearFilters}>
                                    <Text style={styles.applyBtnTextEmpty}>Limpiar</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.applyBtnPrimary} onPress={applyCustomRange}>
                                    <Text style={styles.applyBtnTextPrimary}>Aplicar</Text>
                                </TouchableOpacity>
                            </View>

                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        flexDirection: 'column',
        justifyContent: 'flex-start',
        backgroundColor: '#F5F7FA', // Fondo general mate
        paddingTop: 10,
    },
    filterBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 15,
        backgroundColor: '#FFF',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#E0E0E0',
        marginBottom: 10,
        elevation: 1,
    },
    filterLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconCircle: {
        backgroundColor: '#007BFF',
        borderRadius: 8,
        padding: 8,
        marginRight: 12,
    },
    filterTextGroup: {
        flexDirection: 'column',
    },
    filterTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#333',
    },
    filterText: {
        fontSize: 12,
        color: '#666',
        marginTop: 2,
    },
    filterButtonPrimary: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#007BFF',
        paddingHorizontal: 15,
        paddingVertical: 10,
        borderRadius: 8,
    },
    filterButtonTextPrimary: {
        fontSize: 13,
        color: '#FFF',
        fontWeight: 'bold',
        marginLeft: 6,
    },
    calendarArea: {
        backgroundColor: '#FFF',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#E0E0E0',
        flexShrink: 1, // Permite encogerse para que "OT Detalle" no se salga de vista
        overflow: 'hidden',
    },
    verticalScroller: {
        flexShrink: 1,
    },
    matrixContainer: {
        flexDirection: 'row',
    },
    leftResourceCol: {
        width: LEFT_PANEL_WIDTH,
        backgroundColor: '#FAFAFA',
        borderRightWidth: 1,
        borderRightColor: '#E0E0E0',
        zIndex: 5, // Queda por encima
    },
    rightGridCol: {
        flexDirection: 'column',
    },
    headerSpacer: {
        height: 60, // Altura de los Headers de día (Aumentado para el mes)
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
        backgroundColor: '#FAFAFA',
    },
    headerRowDays: {
        flexDirection: 'row',
        height: 60, // Altura rígida (Aumentado)
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
        backgroundColor: '#FAFAFA',
    },
    dayCell: {
        justifyContent: 'center',
        alignItems: 'center',
        borderRightWidth: 1,
        borderRightColor: '#E0E0E0',
    },
    todayHeaderCell: {
        backgroundColor: '#E3F2FD',
    },
    monthText: {
        fontSize: 10,
        color: '#888',
        textTransform: 'uppercase',
        marginBottom: 2,
        fontWeight: '600',
    },
    dayText: {
        fontWeight: 'bold',
        color: '#444',
        fontSize: 13,
    },
    todayHeaderText: {
        color: '#007BFF', // Destacar día de hoy en azul
    },
    resourceIdentity: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 10,
        height: 100, // Aumentado para dar espacio a bloques de eventos más grandes
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
    },
    emptyResourceIdentity: {
        justifyContent: 'center',
        alignItems: 'center',
        height: 100,
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
        padding: 10,
    },
    emptyResourceText: {
        fontSize: 12,
        color: '#A0A0A0',
        fontStyle: 'italic',
        textAlign: 'center',
    },
    avatarIcon: {
        marginRight: 8,
    },
    resourceName: {
        fontSize: 13, // Ligeramente más grande
        color: '#333',
        flex: 1,
        fontWeight: '500',
    },
    resourceRowGrid: {
        flexDirection: 'row',
        position: 'relative',
        height: 100, // Sincronizado con resourceIdentity
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    gridBackgroundLayer: {
        flexDirection: 'row',
        position: 'absolute',
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
    },
    timelineBgCell: {
        borderRightWidth: 1,
        borderRightColor: '#F5F5F5',
    },
    todayBgCell: {
        backgroundColor: 'rgba(227, 242, 253, 0.3)', // Azul ligero semitransparente para la columna de hoy
    },
    emptyGridRow: {
        height: 100,
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'row',
    },
    emptyGridText: {
        color: '#999',
        fontSize: 14,
        marginLeft: 10,
    },
    eventWrapper: {
        position: 'absolute',
        top: 10, // Margen superior dentro del carril
        height: 80, // Limita que no se pegue abajo (Mas alto)
        zIndex: 10,
    },
    eventBlock: {
        padding: 8, // Más relleno
        borderRadius: 6,
        flex: 1,
        justifyContent: 'center',
    },
    eventHeader: {
        flexDirection: 'row',
        alignItems: 'flex-start', // Titulo de varias lineas pega arriba
        marginBottom: 4,
    },
    eventTitle: {
        color: '#FFF',
        fontSize: 13, // Tamaño de letra MAS GRANDE
        fontWeight: 'bold',
        marginLeft: 4,
        flex: 1,
        lineHeight: 16,
    },
    eventFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        marginLeft: 18,
    },
    eventSub: {
        color: 'rgba(255,255,255,0.95)',
        fontSize: 11, // Placas un poco más grandes
        marginLeft: 4,
        fontWeight: '600',
    },
    bottomPanel: {
        minHeight: 120, // Achicamos un poco para guardar proporción
        backgroundColor: '#FFF',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#E0E0E0',
        marginTop: 10, // EXACTAMENTE 2 ENTERS APROXIMADAMENTE, CASI PEGADO AL BORDE
        flexShrink: 0,
    },
    bottomPanelEmpty: {
        justifyContent: 'center',
        alignItems: 'center',
        padding: 15,
        backgroundColor: '#FAFAFA',
    },
    emptyPanelText: {
        marginTop: 5,
        textAlign: 'center',
        color: '#999',
        fontSize: 13,
    },
    panelHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
        backgroundColor: '#FAFAFA',
        borderTopLeftRadius: 8,
        borderTopRightRadius: 8,
    },
    panelTitle: {
        fontWeight: 'bold',
        fontSize: 13,
        color: '#333',
    },
    panelContentRow: {
        flexDirection: 'row',
        padding: 15,
        paddingTop: 10,
        justifyContent: 'space-between',
    },
    detailCol: {
        flex: 1,
        paddingRight: 10,
    },
    detailColLarge: {
        flex: 2,
        paddingRight: 10,
    },
    statusBadge: {
        backgroundColor: '#E0E0E0',
        alignSelf: 'flex-start',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        marginBottom: 10,
    },
    statusText: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#555',
    },
    detailSection: {
        marginBottom: 8,
    },
    detailLabel: {
        fontSize: 11,
        color: '#888',
        marginBottom: 2,
        fontWeight: 'bold',
    },
    detailValue: {
        fontSize: 12,
        color: '#333',
        lineHeight: 16,
    },
    // Estilos del Modal
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        width: '90%',
        maxWidth: 600,
        backgroundColor: '#FFF',
        borderRadius: 12,
        flexDirection: 'row', // Layout de sidebar
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        overflow: 'hidden',
    },
    sidebarPanel: {
        width: 150,
        backgroundColor: '#F8F9FA',
        borderRightWidth: 1,
        borderRightColor: '#E0E0E0',
        paddingVertical: 20,
    },
    sidebarBtn: {
        paddingVertical: 12,
        paddingHorizontal: 20,
    },
    sidebarBtnActive: {
        backgroundColor: '#007BFF',
    },
    sidebarText: {
        color: '#444',
        fontSize: 14,
    },
    sidebarTextActive: {
        color: '#FFF',
        fontWeight: 'bold',
    },
    calendarPanel: {
        flex: 1,
        padding: 24,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    modalBottomRow: {
        marginTop: 10,
        alignItems: 'flex-end',
    },
    miniCalHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
        paddingHorizontal: 10,
    },
    miniCalNavBtn: {
        padding: 5,
    },
    miniCalMonthName: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#333',
        textTransform: 'uppercase',
    },
    miniCalDaysHeader: {
        flexDirection: 'row',
        marginBottom: 15,
    },
    miniCalDayLabel: {
        flex: 1,
        textAlign: 'center',
        fontWeight: '600',
        color: '#666',
        fontSize: 13,
    },
    miniCalGrid: {
        marginBottom: 0,
    },
    miniCalWeekRow: {
        flexDirection: 'row',
        marginBottom: 2, // Más pegado para estilo de rango
    },
    miniCalDayCell: {
        flex: 1,
        aspectRatio: 1, // Hace los elementos cuadrados
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 0,
    },
    miniCalDaySelected: { // Estilo emulando la foto
        backgroundColor: '#007BFF', // Azul Fuerte Sólido
        borderRadius: 6, // Cuadrado redondeado
    },
    miniCalDayRangeStart: {
        backgroundColor: '#007BFF',
        borderTopLeftRadius: 6,
        borderBottomLeftRadius: 6,
    },
    miniCalDayRangeEnd: {
        backgroundColor: '#007BFF',
        borderTopRightRadius: 6,
        borderBottomRightRadius: 6,
    },
    miniCalDayInRange: {
        backgroundColor: '#E8F4FD',
    },
    miniCalDayDisabled: {
        opacity: 0.3,
    },
    miniCalDayText: {
        fontSize: 14,
        color: '#333',
        fontWeight: '400',
    },
    miniCalDayTextSelected: {
        color: '#FFF', // Letra blanca sobre cuadro azul
        fontWeight: 'bold',
    },
    miniCalDayTextInRange: {
        color: '#004A99',
        fontWeight: '500',
    },
    miniCalDayTextDisabled: {
        color: '#999',
    },
    modalFooterActions: {
        marginTop: 20,
        flexDirection: 'row',
        justifyContent: 'flex-end',
        borderTopWidth: 1,
        borderTopColor: '#EEE',
        paddingTop: 15,
    },
    applyBtnPrimary: {
        backgroundColor: '#007BFF',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 6,
        marginLeft: 10,
    },
    applyBtnTextPrimary: {
        color: '#FFF',
        fontWeight: 'bold',
        fontSize: 14,
    },
    applyBtnEmpty: {
        paddingHorizontal: 15,
        paddingVertical: 10,
        justifyContent: 'center',
    },
    applyBtnTextEmpty: {
        color: '#007BFF',
        fontSize: 14,
    }
});

export default AgendaBoard;
